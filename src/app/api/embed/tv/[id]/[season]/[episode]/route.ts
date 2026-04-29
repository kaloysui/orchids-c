import { NextRequest, NextResponse } from 'next/server';
import { extractEmbedMaster, resolveFinalSource, decodeObfuscatedUrl, isObfuscatedUrl } from '@/lib/scraper';
import { obfuscateUrl, generateSignature } from '@/lib/protection';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

/**
 * Public Embed API - TV Sources
 *
 * GET /api/embed/tv/[id]/[season]/[episode]
 *
 * Path Parameters:
 *   id      (required) — TMDB TV show ID (e.g. 1399)
 *   season  (required) — Season number (e.g. 1)
 *   episode (required) — Episode number (e.g. 1)
 *
 * Query Parameters:
 *   color    — Accent/theme hex color without # (e.g. ?color=ef4444)
 *   autoplay — Autoplay flag: "1" or "0" (default: "1")
 *   lang     — Filter sources by language label keyword (e.g. ?lang=english)
 *
 * Response:
 *   { total, id, season, episode, type, sources, servers, tracks }
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; season: string; episode: string }> }
) {
  const { id, season, episode } = await params;

  // CORS - allow embed usage from external sites
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  try {
    console.log(`[Embed TV API] Fetching sources for TV ${id} S${season}E${episode}`);

    const data = await extractEmbedMaster(`tv/${id}/${season}/${episode}`);

    if (!data.sources || data.sources.length === 0) {
      return NextResponse.json(
        { total: 0, id, season: Number(season), episode: Number(episode), type: 'tv', sources: [], servers: [], tracks: [] },
        { headers: corsHeaders }
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
        season: Number(season),
        episode: Number(episode),
        type: 'tv',
        sources,
        servers,
        tracks: data.tracks || [],
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[Embed TV API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources', details: error?.message || String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
