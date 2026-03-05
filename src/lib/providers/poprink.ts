import { EmbedSource, USER_AGENT, robustFetch } from './utils';

// AES-GCM decryption key (base64-encoded) used by popr.ink's VidNest provider
const VIDNEST_KEY = 'A7kP9mQeXU2BWcD4fRZV+Sg8yN0/M5tLbC1HJQwYe6pOKFaE3vTnPZsRuYdVmLq2';

// Animanga backend servers used by popr.ink
const SERVERS: Record<string, { name: string; movie: string; tv: string }> = {
  alfa:  { name: 'VidNest Alfa',  movie: 'https://new.animanga.fun/primesrc/movie',     tv: 'https://new.animanga.fun/primesrc/tv' },
  lamda: { name: 'VidNest Lamda', movie: 'https://one.animanga.fun/allmovies/movie',    tv: 'https://one.animanga.fun/allmovies/tv' },
  sigma: { name: 'VidNest Sigma', movie: 'https://new.animanga.fun/hollymoviehd/movie', tv: 'https://new.animanga.fun/hollymoviehd/tv' },
  delta: { name: 'VidNest Delta', movie: 'https://one.animanga.fun/allmovies/movie',    tv: 'https://one.animanga.fun/allmovies/tv' },
};

async function decryptVidNest(encryptedB64: string): Promise<any | null> {
  try {
    // Key is base64-encoded; truncate to 32 bytes for AES-256
    const keyBytes = Uint8Array.from(atob(VIDNEST_KEY), c => c.charCodeAt(0)).slice(0, 32);
    const s = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));

    // Layout: [iv:12][ciphertext:n][tag:16]
    const iv = s.slice(0, 12);
    const tag = s.slice(s.length - 16);
    const cipherBody = s.slice(12, s.length - 16);

    // Web Crypto expects ciphertext + tag concatenated
    const combined = new Uint8Array(cipherBody.length + tag.length);
    combined.set(cipherBody, 0);
    combined.set(tag, cipherBody.length);

    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      cryptoKey,
      combined
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (e) {
    console.error('[Poprink] Decrypt error:', e);
    return null;
  }
}

interface VidNestSource {
  url?: string;
  file?: string;
  quality?: string;
  type?: string;
  isM3U8?: boolean;
  headers?: Record<string, string>;
}

export async function tryPoprink(path: string): Promise<{ sources: EmbedSource[], baseUrl: string } | null> {
  try {
    const isTV = path.startsWith('tv/');
    let tmdbId: string;
    let season = '1';
    let episode = '1';

    if (isTV) {
      const parts = path.replace('tv/', '').split('/');
      tmdbId = parts[0];
      season = parts[1] || '1';
      episode = parts[2] || '1';
    } else {
      tmdbId = path.replace('movie/', '');
    }

    console.log('[Scraper] Trying poprink (VidNest) for:', path);

    const fetchServer = async (key: string, server: typeof SERVERS[string]): Promise<EmbedSource[]> => {
      try {
        const url = isTV
          ? `${server.tv}/${tmdbId}/${season}/${episode}`
          : `${server.movie}/${tmdbId}`;

        const res = await robustFetch(url, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
            'Referer': 'https://www.popr.ink/',
            'Origin': 'https://www.popr.ink',
          }
        }, 1, 12000);

        if (!res.ok) return [];

        let data = await res.json();

        // Decrypt if encrypted
        if (data.encrypted && typeof data.data === 'string') {
          const decrypted = await decryptVidNest(data.data);
          if (!decrypted) return [];
          data = decrypted;
        }

        const rawSources: VidNestSource[] = [
          ...(Array.isArray(data.sources) ? data.sources : []),
          ...(Array.isArray(data.streams) ? data.streams : []),
          ...(data.url ? [{ url: data.url, isM3U8: String(data.url).includes('.m3u8') }] : []),
        ];

        const results: EmbedSource[] = [];
        for (const src of rawSources) {
          const srcUrl = src.url || src.file;
          if (!srcUrl) continue;

          const isHls = src.isM3U8 === true || src.type === 'hls' || srcUrl.includes('.m3u8');
          const headers: Record<string, string> = { ...(src.headers || {}) };

          // alfa server requires primevid referer for HLS
          if (key === 'alfa' && isHls) {
            headers['Referer'] = 'https://primevid.click/';
          }

          results.push({
            id: 0,
            name: server.name,
            quality: src.quality || 'auto',
            title: `${server.name} (${src.quality || 'auto'})`,
            url: srcUrl,
            type: isHls ? 'hls' : 'mp4',
            useProxy: false,
            headers,
          });
        }

        return results;
      } catch (e) {
        console.log(`[Poprink] ${key} error:`, e);
        return [];
      }
    };

    const serverResults = await Promise.allSettled(
      Object.entries(SERVERS).map(([key, server]) => fetchServer(key, server))
    );

    const sources: EmbedSource[] = [];
    let sourceId = 1;

    for (const result of serverResults) {
      if (result.status === 'fulfilled') {
        for (const s of result.value) {
          sources.push({ ...s, id: sourceId++ });
        }
      }
    }

    console.log(`[Scraper] poprink found ${sources.length} sources`);
    return sources.length > 0 ? { sources, baseUrl: 'https://www.popr.ink' } : null;
  } catch (e) {
    console.error('[Scraper] poprink error:', e);
    return null;
  }
}
