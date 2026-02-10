import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

function cleanName(name: string) {
  if (!name) return "";
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/ft\..*/gi, '')
    .replace(/feat\..*/gi, '')
    .replace(/official video.*/gi, '')
    .replace(/lyrics.*/gi, '')
    .replace(/audio.*/gi, '')
    .replace(/video.*/gi, '')
    .replace(/full version.*/gi, '')
    .replace(/remix.*/gi, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function parseLRC(lrcContent: string) {
  if (!lrcContent) return [];
  const lines = lrcContent.split('\n');
  const parsed = [];
  const lrcRegex = /\[(\d+):(\d+\.\d+)\](.*)/;
  
  for (const line of lines) {
    const match = line.match(lrcRegex);
    if (match) {
      const [_, mins, secs, text] = match;
      const ts = parseInt(mins) * 60 + parseFloat(secs);
      parsed.push({
        ts,
        x: text.trim()
      });
    }
  }
  return parsed;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");

  if (!title || !artist) {
    return NextResponse.json({ error: "Missing title or artist" }, { status: 400 });
  }

  const cleanedTitle = cleanName(title);
  const cleanedArtist = cleanName(artist);

  try {
    // 1. Try exact match from LRCLIB
    const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const getRes = await fetch(getUrl, {
      headers: { 'User-Agent': 'OrchidsMusicApp/1.0' },
      next: { revalidate: 3600 }
    });

    if (getRes.ok) {
      const data = await getRes.json();
      if (data.syncedLyrics) {
        return NextResponse.json({
          lyrics: parseLRC(data.syncedLyrics),
          type: "synced"
        });
      }
      if (data.plainLyrics) {
        return NextResponse.json({
          lyrics: data.plainLyrics,
          type: "plain"
        });
      }
    }

    // 2. Try search if exact match failed
    const query = `${cleanedTitle} ${cleanedArtist}`;
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'OrchidsMusicApp/1.0' },
      next: { revalidate: 3600 }
    });

    if (searchRes.ok) {
      const results = await searchRes.json();
      if (results && Array.isArray(results) && results.length > 0) {
        // Try to find a good match
        const bestMatch = results.find(res => 
          res.trackName.toLowerCase().includes(cleanedTitle.toLowerCase()) &&
          res.artistName.toLowerCase().includes(cleanedArtist.toLowerCase())
        ) || results[0];

        if (bestMatch.syncedLyrics) {
          return NextResponse.json({
            lyrics: parseLRC(bestMatch.syncedLyrics),
            type: "synced"
          });
        }
        if (bestMatch.plainLyrics) {
          return NextResponse.json({
            lyrics: bestMatch.plainLyrics,
            type: "plain"
          });
        }
      }
    }

    return NextResponse.json({ error: "Lyrics not found" }, { status: 404 });

  } catch (error) {
    console.error("Lyrics fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch lyrics" }, { status: 500 });
  }
}
