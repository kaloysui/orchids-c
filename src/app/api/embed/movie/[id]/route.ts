import { NextRequest, NextResponse } from 'next/server';
import { extractEmbedMaster, resolveFinalSource, decodeObfuscatedUrl, isObfuscatedUrl } from '@/lib/scraper';
import { obfuscateUrl, generateSignature } from '@/lib/protection';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

/**
 * Public Embed API - Movie Sources
 *
 * GET /api/embed/movie/[id]
 *
 * Path Parameters:
 *   id (required) — TMDB movie ID (e.g. 129)
 *
 * Query Parameters:
 *   color    — Accent/theme hex color without # (e.g. ?color=3b82f6)
 *   autoplay — Autoplay flag: "1" or "0" (default: "1")
 *   lang     — Filter sources by language label keyword (e.g. ?lang=english)
 *
 * Response:
 *   { total, sources, servers, tracks }
 *   servers[n]: { name, quality, type, url, flag }
 */

function wrapWithProxy(url: string, headers?: Record<string, string>): string {
  if (!url || url.startsWith('/api/proxy')) return url;
  const obfuscated = obfuscateUrl(url);
  const sig = generateSignature(obfuscated);
  let proxyUrl = `/api/proxy?d=${encodeURIComponent(obfuscated)}&s=${sig}`;
  if (headers) {
    proxyUrl += `&headers=${encodeURIComponent(JSON.stringify(headers))}`;
  }
  return proxyUrl;
}

async function resolveWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms))
  ]);
}

const INTERNAL_KEY = 'bcine_internal_2024_x7k9';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = req.nextUrl;

  // CORS - allow embed usage from external sites
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }

  // Allow both internal key auth AND direct public access
  const internalKey = req.headers.get('x-bcine-key');
  const isInternal = internalKey === INTERNAL_KEY;

  try {
    console.log(`[Embed Movie API] Fetching sources for movie ID: ${id}`);

    const data = await extractEmbedMaster(`movie/${id}`);

    if (!data.sources || data.sources.length === 0) {
      return NextResponse.json(
        { total: 0, sources: [], servers: [], tracks: [], id, type: 'movie' },
        { headers }
      );
    }

    const resolvedSources = await Promise.all(
      data.sources.map(async (source: any) => {
        try {
          let sourceUrl = source.url;

          if ((source.type === 'vidify' || source.type === 'vidzee' || source.type === 'hls' || source.type === 'm3u8' || source.type === 'mp4') && sourceUrl.startsWith('http')) {
            return {
              url: sourceUrl,
              type: sourceUrl.includes('.m3u8') ? 'm3u8' : (source.type === 'hls' ? 'm3u8' : source.type),
              name: source.name,
              quality: source.quality,
              lang: source.lang,
              headers: source.headers,
              useProxy: source.useProxy,
              flag: source.flag,
            };
          }

          if (isObfuscatedUrl(sourceUrl)) {
            const decoded = decodeObfuscatedUrl(sourceUrl);
            if (decoded) {
              return {
                url: decoded,
                type: decoded.includes('.m3u8') ? 'm3u8' : 'mp4',
                name: source.name,
                quality: source.quality,
                useProxy: source.useProxy,
                flag: source.flag,
              };
            }
          }

          const resolved = await resolveWithTimeout(resolveFinalSource(data.baseUrl, sourceUrl), 15000);
          if (resolved && resolved.type !== 'error' && resolved.url) {
            return {
              url: resolved.url,
              type: resolved.type,
              name: source.name,
              quality: source.quality,
              lang: source.lang,
              useProxy: source.useProxy,
              flag: source.flag,
            };
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    const validSources = resolvedSources.filter((s): s is NonNullable<typeof s> => s !== null);

    // For public embed API, return readable server info
    const servers = validSources.map((s) => {
      const finalUrl = s.useProxy ? wrapWithProxy(s.url, s.headers) : obfuscateUrl(s.url);

      let flag = s.flag || 'US';
      if (!s.flag && s.lang) {
        const l = s.lang.toLowerCase();
        if (l.includes('tamil') || l.includes('telugu') || l.includes('hindi')) flag = 'IN';
        else if (l.includes('vietnamese')) flag = 'VN';
        else if (l.includes('japanese')) flag = 'JP';
      }

      return {
        name: s.name || 'Server',
        quality: s.quality || 'Auto',
        type: s.type,
        url: finalUrl,
        flag,
      };
    });

    const sources = validSources.map((s) =>
      s.useProxy ? wrapWithProxy(s.url, s.headers) : obfuscateUrl(s.url)
    );

    return NextResponse.json(
      {
        total: sources.length,
        id,
        type: 'movie',
        sources,
        servers,
        tracks: data.tracks || [],
      },
      { headers }
    );
  } catch (error: any) {
    console.error('[Embed Movie API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources', details: error?.message || String(error) },
      { status: 500, headers }
    );
  }
}
