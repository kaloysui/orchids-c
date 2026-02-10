import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');
  const url = searchParams.get('url');

  // Proxy mode: fetch a subtitle file URL and return its content
  if (url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subtitle file: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      let content: string;
      try {
        content = new TextDecoder('utf-8').decode(buffer);
      } catch {
        content = new TextDecoder('iso-8859-1').decode(buffer);
      }

      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('Error proxying subtitle file:', error);
      return NextResponse.json({ error: 'Failed to fetch subtitle file' }, { status: 500 });
    }
  }

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    // Build Wyzie subtitle API URL (uses TMDB IDs directly)
    const wyzieParams = new URLSearchParams({ id });
    if (season && episode) {
      wyzieParams.set('season', season);
      wyzieParams.set('episode', episode);
    }

    const response = await fetch(`https://sub.wyzie.ru/search?${wyzieParams.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Wyzie subtitles error (${response.status})`);
      return NextResponse.json([]);
    }

    const data = await response.json();

    const langCounts: Record<string, number> = {};
    const subtitles = (data || [])
      .filter((sub: any) => sub.format === 'srt')
      .slice(0, 50)
      .map((sub: any) => {
        try {
          const baseLang = sub.display || 'Unknown';
          langCounts[baseLang] = (langCounts[baseLang] || 0) + 1;

          const lang = langCounts[baseLang] > 1
            ? `${baseLang} (${langCounts[baseLang]})`
            : baseLang;

          // Proxy through our API to avoid CORS issues
          const proxyUrl = `/api/subtitles?url=${encodeURIComponent(sub.url)}`;

          return {
            file: proxyUrl,
            lang: lang,
            language: sub.language || 'en',
            id: sub.id || `sub-${Math.random().toString(36).slice(2)}`,
          };
        } catch (e) {
          console.error('Error processing subtitle entry:', e);
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json(subtitles);

  } catch (error: any) {
    console.error('Error in subtitles API:', error);
    return NextResponse.json({
      error: 'Failed to fetch subtitles',
      details: error?.message || String(error),
    }, { status: 500 });
  }
}
