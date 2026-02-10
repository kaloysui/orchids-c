import { NextRequest, NextResponse } from 'next/server';
import { extractEmbedMaster, resolveSourceDirectly, decodeObfuscatedUrl, isObfuscatedUrl } from '@/lib/scraper';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }
  return handleScrape(url);
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    return handleScrape(url);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

async function handleScrape(url: string) {
  try {
    if (isObfuscatedUrl(url)) {
      const decodedUrl = decodeObfuscatedUrl(url);
        if (decodedUrl) {
            const isM3u8 = decodedUrl.includes('.m3u8');
            const isMp4 = decodedUrl.includes('.mp4');
            return NextResponse.json({
              direct: true,
              type: isM3u8 ? 'm3u8' : (isMp4 ? 'mp4' : 'unknown'),
              url: decodedUrl,
              originalUrl: decodedUrl,
              source: 'decoded'
            });
        }
    }

    let targetUrl = url;
    const lowerUrl = url.toLowerCase().trim();

    if (/^\d+$/.test(lowerUrl)) {
      targetUrl = `movie/${lowerUrl}`;
    }
    else if (/^(?:tv:)?(\d+)[-/:](\d+)[-/:](\d+)$/i.test(lowerUrl)) {
      const match = lowerUrl.match(/^(?:tv:)?(\d+)[-/:](\d+)[-/:](\d+)$/i);
      if (match) {
        targetUrl = `tv/${match[1]}/${match[2]}/${match[3]}`;
      }
    }
    else if (/^movie:(\d+)$/i.test(lowerUrl)) {
      const match = lowerUrl.match(/^movie:(\d+)$/i);
      if (match) {
        targetUrl = `movie/${match[1]}`;
      }
    }
    else if (/^tmdb:(?:tv:)?(\d+)(?:[:\/-](\d+))?(?:[:\/-](\d+))?$/i.test(lowerUrl)) {
      const match = lowerUrl.match(/^tmdb:(?:tv:)?(\d+)(?:[:\/-](\d+))?(?:[:\/-](\d+))?$/i);
      if (match) {
        if (match[2] && match[3]) {
          targetUrl = `tv/${match[1]}/${match[2]}/${match[3]}`;
        } else {
          targetUrl = `movie/${match[1]}`;
        }
      }
    }
    else if (/^vidmoly:([a-z0-9]+)$/i.test(lowerUrl)) {
      const match = lowerUrl.match(/^vidmoly:([a-z0-9]+)$/i);
      if (match) {
        targetUrl = `https://vidmoly.net/embed-${match[1]}.html`;
      }
    }

    const sourcesToDirect = ['vidmoly', 'streamwish', 'strwish', 'swish', 'dood', 'd0000d', 'ds2play', 'mixdrop', 'lulu', 'workers.dev', 'bunny'];

    if (sourcesToDirect.some(s => targetUrl.toLowerCase().includes(s))) {
      const direct = await resolveSourceDirectly(targetUrl);
      if (direct.type !== 'error' && direct.type !== 'iframe') {
        return NextResponse.json({
          direct: true,
          ...direct
        });
      }
    }

    const data = await extractEmbedMaster(targetUrl);
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
