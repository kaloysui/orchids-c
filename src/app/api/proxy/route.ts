import { NextRequest } from 'next/server';
import { deobfuscateUrl, verifySignature, isAllowedRequest, obfuscateUrl, generateSignature } from '@/lib/protection';

export const runtime = 'edge';
export const preferredRegion = 'auto';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type, X-Requested-With, Origin, Accept',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, X-Proxy-Success',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  // 1. Strict origin/referer check
  if (!isAllowedRequest(req)) {
    console.error('[Proxy] Forbidden origin/referer');
    return new Response('Forbidden: Access Restricted', { status: 403, headers: CORS_HEADERS });
  }

  const d = req.nextUrl.searchParams.get('d');
  const s = req.nextUrl.searchParams.get('s');
  
  if (!d || !s) {
    return new Response('Missing Secure Parameters', { status: 400, headers: CORS_HEADERS });
  }

  // 2. Strict signature verification
  if (!verifySignature(d, s)) {
    console.error('[Proxy] Invalid signature');
    return new Response('Invalid Signature', { status: 403, headers: CORS_HEADERS });
  }

  const url = deobfuscateUrl(d);
  if (!url) {
    return new Response('Invalid Obfuscated URL', { status: 400, headers: CORS_HEADERS });
  }

  const customHeaders = req.nextUrl.searchParams.get('headers');

  try {
    const targetUrl = new URL(url);
    const hostname = targetUrl.hostname;
    
    // Auto-detect provider to set correct headers
    const isBunny = hostname.includes('workers.dev') || hostname.includes('bunny');
    const isVidify = hostname.includes('vidify.top') || hostname.includes('apiv2.vidify.top') || hostname.includes('player.vidify.top') || hostname.includes('rivestream.app');
    const isVidzee = hostname.includes('rabbitstream') || hostname.includes('megacloud') || hostname.includes('dokicloud') || hostname.includes('vizcloud') || hostname.includes('rapid-cloud') || hostname.includes('1shows.app') || hostname.includes('67streams.online') || hostname.includes('veyda') || hostname.includes('vidzee.wtf');

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
    };

    const range = req.headers.get('range');
    if (range) headers['Range'] = range;

    if (customHeaders) {
      try {
        const parsed = JSON.parse(customHeaders);
        Object.assign(headers, parsed);
      } catch {}
    } else if (isVidzee) {
      headers['Referer'] = 'https://player.vidzee.wtf/';
      headers['Origin'] = 'https://player.vidzee.wtf';
      headers['X-Requested-With'] = 'XMLHttpRequest';
    } else if (isVidify) {
      headers['Referer'] = 'https://player.vidify.top/';
      headers['Origin'] = 'https://player.vidify.top';
    } else if (isBunny) {
      headers['Referer'] = 'https://embdmstrplayer.com/';
      headers['Origin'] = 'https://embdmstrplayer.com';
    } else {
      // Default to target origin if not specified
      headers['Referer'] = targetUrl.origin + '/';
      headers['Origin'] = targetUrl.origin;
    }

    let res: Response | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        res = await fetch(url, { 
          headers,
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(timeoutId);

        // If 403, try stripping Origin
        if (res.status === 403 && headers['Origin']) {
          delete headers['Origin'];
          attempts++;
          continue;
        }

        if (res.ok || (res.status !== 502 && res.status !== 503 && res.status !== 504 && res.status !== 522)) {
          break;
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (attempts === maxAttempts - 1) throw err;
      }
      attempts++;
      await new Promise(r => setTimeout(r, 1000 * attempts));
    }
    
    if (!res) throw new Error('Failed to fetch after multiple attempts');
    if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
      const location = res.headers.get('Location');
      if (location) {
        const absLocation = new URL(location, url).href;
        const obs = obfuscateUrl(absLocation);
        const sig = generateSignature(obs);
        return Response.redirect(new URL(`/api/proxy?d=${encodeURIComponent(obs)}&s=${sig}`, req.url).href, 302);
      }
    }

    const contentType = res.headers.get('Content-Type') || '';
    const isM3U8 = url.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL');
    
    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    
      if (isM3U8 || (contentType.includes('text') && decoder.decode(buffer.slice(0, 10)).includes('#EXTM3U'))) {
        const text = decoder.decode(buffer);
        const origin = targetUrl.origin;
        const currentDir = url.substring(0, url.lastIndexOf('/') + 1);
        
        const rewrite = (u: string) => {
          if (!u || u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('/api/proxy') || u.startsWith('#')) return u;
          let abs = u.trim().replace(/^["']|["']$/g, '');
          if (abs.startsWith('//')) abs = 'https:' + abs;
          else if (abs.startsWith('/')) {
            abs = origin + abs;
          } else if (!abs.startsWith('http')) {
            try {
              abs = new URL(abs, currentDir).href;
            } catch {
              return u;
            }
          }
          const obs = obfuscateUrl(abs);
          const sig = generateSignature(obs);
          let proxyUrl = `/api/proxy?d=${encodeURIComponent(obs)}&s=${sig}`;
          if (customHeaders) {
            proxyUrl += `&headers=${encodeURIComponent(customHeaders)}`;
          }
          return proxyUrl;
        };

      // Comprehensive m3u8 rewriting
      const rewritten = text
        .split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (!trimmed) return line;
          
          if (trimmed.startsWith('#')) {
            // Check for URI in tags like #EXT-X-KEY, #EXT-X-MAP, #EXT-X-MEDIA, etc.
            // Improved regex to handle various tag formats
            return line.replace(/(URI|URL|NAME)=["']?([^"'\s,]+)["']?/g, (match, key, p1) => {
              if (key === 'NAME') return match; // Don't rewrite names
              return `${key}="${rewrite(p1)}"`;
            });
          }
          
          // It's a URL/Path
          return rewrite(trimmed);
        })
        .join('\n');


      return new Response(rewritten, {
        headers: { 
          ...CORS_HEADERS, 
          'Content-Type': 'application/vnd.apple.mpegurl', 
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=60',
          'X-Accel-Buffering': 'no',
          'X-Proxy-Success': 'true'
        }
      });
    }

    const h: Record<string, string> = { 
      ...CORS_HEADERS, 
      'X-Content-Type-Options': 'nosniff',
      'X-Accel-Buffering': 'no',
      'X-Proxy-Success': 'true'
    };
    
    const forwardHeaders = [
      'Content-Type', 
      'Content-Length', 
      'Content-Range', 
      'Accept-Ranges', 
      'ETag', 
      'Last-Modified',
      'Cache-Control'
    ];

    forwardHeaders.forEach(k => {
      const v = res.headers.get(k);
      if (v) h[k] = v;
    });

    return new Response(buffer, { 
      status: res.status, 
      headers: h 
    });

  } catch (e: any) {
    console.error('[Proxy] Error:', e.message);
    return new Response(e.message, { status: 500, headers: CORS_HEADERS });
  }
}
