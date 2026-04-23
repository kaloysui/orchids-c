import { EmbedSource, USER_AGENT, robustFetch } from './utils';

const BASE = 'https://media-proxy.vynx.workers.dev';
const TIMEOUT = 10000;

interface FlixerSource {
  quality: string;
  title: string;
  url: string;
  type: string;
  referer?: string;
  requiresSegmentProxy?: boolean;
  status?: string;
  language?: string;
  server?: string;
}

interface FlixerResponse {
  success: boolean;
  sources: FlixerSource[];
}

export async function tryFlixer(
  path: string
): Promise<{ sources: EmbedSource[]; baseUrl: string } | null> {
  try {
    const isTV = path.startsWith('tv/');
    let tmdbId: string;
    let season: string | undefined;
    let episode: string | undefined;

    if (isTV) {
      const parts = path.replace('tv/', '').split('/');
      tmdbId = parts[0];
      season = parts[1] || '1';
      episode = parts[2] || '1';
    } else {
      tmdbId = path.replace('movie/', '');
    }

    const apiUrl = isTV
      ? `${BASE}/flixer/extract-all?tmdbId=${tmdbId}&type=tv&season=${season}&episode=${episode}`
      : `${BASE}/flixer/extract-all?tmdbId=${tmdbId}`;

    console.log('[Scraper] Trying Flixer for:', path);

    const res = await robustFetch(
      apiUrl,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
      },
      1,
      TIMEOUT
    );

    if (!res.ok) return null;

    const data: FlixerResponse = await res.json();

    if (!data.success || !data.sources?.length) return null;

    let sourceId = 1;

    const sources: EmbedSource[] = data.sources
      .filter((s) => s.url && s.status === 'working')
      .map((s) => {
        const proxiedUrl = `${BASE}/flixer/stream?url=${encodeURIComponent(s.url)}`;

        return {
          id: sourceId++,
          name: s.title,
          title: s.title,
          url: proxiedUrl, 
          type: s.type === 'hls' ? 'hls' : 'mp4',
          quality: s.quality || 'Auto',
          headers: {
            Referer: s.referer || '',
          },
          useProxy: false, 
        };
      });

    console.log(`[Scraper] Flixer found ${sources.length} sources`);

    return sources.length > 0
      ? { sources, baseUrl: BASE }
      : null;

  } catch (e) {
    console.error('[Scraper] Flixer error:', e);
    return null;
  }
}
