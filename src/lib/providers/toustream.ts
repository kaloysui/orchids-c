import { EmbedSource, USER_AGENT, robustFetch } from './utils';

const BASE = 'https://toustream.movietrunk.com';
const TIMEOUT = 10000;

const SERVERS = [
  { id: 'viper', name: 'Tou Viper' },
  { id: 'vulture', name: 'Tou Vulture' },
  { id: 'dodo', name: 'Tou Dodo' },
  { id: 'owl', name: 'Tou Owl' },
  { id: 'ox', name: 'Tou Ox' },
  { id: 'zebra', name: 'Tou Zebra' },
  { id: 'turtle', name: 'Tou Turtle' },
];

interface TouResponse {
  streamUrl?: string;
  source?: string;
  quality?: string;
  isHls?: boolean;
  qualities?: string[];
}

async function fetchServer(
  serverName: string,
  apiUrl: string,
): Promise<EmbedSource | null> {
  try {
    const res = await robustFetch(apiUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': BASE,
        'Origin': BASE,
        'Accept': 'application/json, */*',
      },
    }, 1, TIMEOUT);

    if (!res.ok) return null;

    const data: TouResponse = await res.json();

    if (!data.streamUrl) return null;

    // convert relative → absolute
    const fullUrl = data.streamUrl.startsWith('http')
      ? data.streamUrl
      : `${BASE}${data.streamUrl}`;

    return {
      id: 0,
      name: serverName,
      title: serverName,
      url: fullUrl,
      type: data.isHls ? 'hls' : 'mp4',
      quality: data.quality || 'Auto',
      useProxy: false,
    } as EmbedSource;

  } catch {
    return null;
  }
}

export async function tryToustream(
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

    console.log('[Scraper] Trying Toustream for:', path);

    const fetches = SERVERS.map((server) => {
      const apiUrl = isTV
        ? `${BASE}/tou/get-source/tv/${tmdbId}/${season}/${episode}?server=${server.id}`
        : `${BASE}/tou/get-source/movie/${tmdbId}?server=${server.id}`;

      return fetchServer(server.name, apiUrl);
    });

    const results = await Promise.allSettled(fetches);

    const sources: EmbedSource[] = [];
    let sourceId = 1;

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        sources.push({ ...result.value, id: sourceId++ });
      }
    }

    console.log(`[Scraper] Toustream found ${sources.length} sources`);

    return sources.length > 0
      ? { sources, baseUrl: BASE }
      : null;

  } catch (e) {
    console.error('[Scraper] Toustream error:', e);
    return null;
  }
}
