import { NextRequest } from 'next/server';
import { deobfuscateUrl, verifySignature, isAllowedRequest, obfuscateUrl, generateSignature } from '@/lib/protection';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type, X-Requested-With, Origin, Accept',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  if (!isAllowedRequest(req)) {
    return new Response('Forbidden', { status: 403, headers: CORS_HEADERS });
  }

  const d = req.nextUrl.searchParams.get('d');
  const s = req.nextUrl.searchParams.get('s');

  if (!d || !s || !verifySignature(d, s)) {
    return new Response('Invalid Request', { status: 403, headers: CORS_HEADERS });
  }

  const url = deobfuscateUrl(d);
  if (!url) {
    return new Response('Invalid URL', { status: 400, headers: CORS_HEADERS });
  }

  try {
    const targetUrl = new URL(url);

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0',
      'Accept': '*/*',
      'Connection': 'keep-alive',
    };

    const range = req.headers.get('range');
    if (range) headers['Range'] = range;

    // basic referer/origin
    headers['Referer'] = targetUrl.origin + '/';
    headers['Origin'] = targetUrl.origin;

    const res = await fetch(url, {
      headers,
      // allow caching layer (important for Cloudflare)
      cache: 'default',
    });

    const contentType = res.headers.get('Content-Type') || '';

    // =========================
    // 🎬 M3U8 HANDLING
    // =========================
    if (contentType.includes('mpegurl') || url.includes('.m3u8')) {
      const text = await res.text();

      const origin = targetUrl.origin;
      const currentDir = url.substring(0, url.lastIndexOf('/') + 1);

      const rewrite = (u: string) => {
        if (!u || u.startsWith('#')) return u;

        let abs = u.trim();

        if (abs.startsWith('//')) abs = 'https:' + abs;
        else if (abs.startsWith('/')) abs = origin + abs;
        else if (!abs.startsWith('http')) {
          abs = new URL(abs, currentDir).href;
        }

        const obs = obfuscateUrl(abs);
        const sig = generateSignature(obs);

        return `/api/proxy?d=${encodeURIComponent(obs)}&s=${sig}`;
      };

      const rewritten = text
        .split('\n')
        .map(line => {
          if (line.startsWith('#')) {
            return line.replace(/URI="([^"]+)"/g, (_, p1) => {
              return `URI="${rewrite(p1)}"`;
            });
          }
          return rewrite(line);
        })
        .join('\n');

      return new Response(rewritten, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/vnd.apple.mpegurl',
          // allow CDN caching
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        },
      });
    }

    // =========================
    // 🎥 VIDEO / SEGMENT STREAM
    // =========================
    const responseHeaders: Record<string, string> = {
      ...CORS_HEADERS,
      'Accept-Ranges': 'bytes',
      'Content-Type': contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=60',
    };

    const forwardHeaders = [
      'Content-Length',
      'Content-Range',
      'Accept-Ranges',
      'ETag',
      'Last-Modified',
    ];

    forwardHeaders.forEach(k => {
      const v = res.headers.get(k);
      if (v) responseHeaders[k] = v;
    });

    // 🚀 CRITICAL: STREAM DIRECTLY (NO BUFFER)
    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (err: any) {
    return new Response(err.message, {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
