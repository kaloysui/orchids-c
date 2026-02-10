import { NextRequest, NextResponse } from 'next/server';
import { extractEmbedMaster, resolveFinalSource, decodeObfuscatedUrl, isObfuscatedUrl } from '@/lib/scraper';
import { obfuscateUrl, generateSignature } from '@/lib/protection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

async function checkUrlStatus(url: string, timeout = 5000): Promise<number> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    clearTimeout(id);
    return response.status;
  } catch (error) {
    return 522;
  }
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
  
  // Protect API from direct access - only allow internal requests
  const internalKey = req.headers.get('x-bcine-key');
  if (internalKey !== INTERNAL_KEY) {
    return NextResponse.json({ 
      message: 'This content is protected.',
      status: 'protected' 
    }, { status: 403 });
  }

    try {
      console.log(`[TV API] Fetching sources for TV ${id} S${season}E${episode}`);
      
      // Local sources are not supported on Edge runtime with FS
      const localSources: any[] = [];

      const data = await extractEmbedMaster(`tv/${id}/${season}/${episode}`);
      
      if (!data.sources || data.sources.length === 0) {
        return NextResponse.json({ total: 0, sources: [], servers: [], tracks: [] });
      }

      const allSources = [...data.sources];

const resolvedSources = await Promise.all(
          allSources.map(async (source) => {
            try {
              let sourceUrl = source.url;
              
              if (source.type === 'vidify' && sourceUrl.startsWith('http')) {
                return {
                  url: sourceUrl,
                  type: sourceUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
                  name: source.name,
                  quality: source.quality,
                  headers: source.headers,
                  useProxy: source.useProxy,
                  flag: source.flag
                };
              }
              
                if (source.type === 'vidzee' && sourceUrl.startsWith('http')) {
                  return {
                    url: sourceUrl,
                    type: 'm3u8',
                    name: source.name,
                    quality: source.quality,
                    lang: source.lang,
                    useProxy: source.useProxy,
                    flag: source.flag
                  };
                }
              
              if ((source.type === 'hls' || source.type === 'mp4') && sourceUrl.startsWith('http')) {
                return {
                  url: sourceUrl,
                  type: source.type === 'hls' ? 'm3u8' : source.type,
                  name: source.name,
                  quality: source.quality,
                  headers: source.headers,
                  useProxy: source.useProxy,
                  flag: source.flag
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
                    flag: source.flag
                  };
                }
              }
          
          const resolved = await resolveWithTimeout(
            resolveFinalSource(data.baseUrl, sourceUrl),
            15000
          );
          
            if (resolved && resolved.type !== 'error' && resolved.url) {
              return {
                url: resolved.url,
                type: resolved.type,
                name: source.name,
                quality: source.quality,
                lang: source.lang,
                useProxy: source.useProxy,
                flag: source.flag
              };
            }
          return null;
        } catch (e) {
          return null;
        }
      })
    );

      const validSources = [
        ...localSources,
        ...resolvedSources.filter((s): s is NonNullable<typeof s> => s !== null)
      ];

      // Check status and sort
      const sourcesWithStatus = await Promise.all(
        validSources.map(async (s, index) => {
          // Local sources are always 200
          if (s.url.startsWith('/uploads')) {
            return { ...s, status: 200, originalIndex: index };
          }
          // Sources that will use proxy - assume 200 (they'll work via proxy)
          if (s.useProxy) {
            return { ...s, status: 200, originalIndex: index };
          }
          // Fast status check
          const status = await checkUrlStatus(s.url, 3000);
          return { ...s, status, originalIndex: index };
        })
      );

      // Sort: 200 OK first, maintain original order within same status
      const sortedSources = sourcesWithStatus.sort((a, b) => {
        if (a.status === 200 && b.status !== 200) return -1;
        if (a.status !== 200 && b.status === 200) return 1;
        return a.originalIndex - b.originalIndex;
      });

    
    // Obfuscate for client transport (or wrap with proxy)
    const sources = sortedSources.map(s => {
      if (s.useProxy) {
        return wrapWithProxy(s.url, s.headers);
      }
      return obfuscateUrl(s.url);
    });
    const servers = sortedSources.map(s => {
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
        title: s.title || s.name || 'Server',
        quality: s.quality || 'Auto',
        type: s.type,
        url: finalUrl,
        headers: s.useProxy ? undefined : s.headers,
        useProxy: s.useProxy,
        flag
      };
    });

    return NextResponse.json({
      total: sources.length,
      sources,
      servers,
      tracks: data.tracks || []
    });
  } catch (error: any) {
    console.error('Error in TV API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch sources', 
      details: error?.message || String(error) 
    }, { status: 500 });
  }
}
