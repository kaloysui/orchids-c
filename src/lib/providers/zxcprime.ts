import { EmbedSource, USER_AGENT, robustFetch } from './utils';
import { getMediaDetails } from '../tmdb';
import crypto from 'crypto';

const ZXC_BASE = 'https://www.zxcstream.xyz';

const SERVERS = [
  { id: 11, name: 'Icarus' },
  { id: 0,  name: 'Daedalus' },
  { id: 1,  name: 'Thanatos' },
  { id: 2,  name: 'Aether' },
  { id: 3,  name: 'Orion' },
  { id: 4,  name: 'Helios' },
  { id: 6,  name: 'Echo' },
  { id: 7,  name: 'Morpheus' },
];

function generateFrontendToken(id: string): { f_token: string; f_ts: number } {
  const ts = Date.now();
  const f_token = crypto.createHash('sha256').update(`${id}:${ts}`).digest('hex');
  return { f_token, f_ts: ts };
}

async function getApiToken(tmdbId: string, f_token: string, f_ts: number): Promise<{ token: string; ts: number } | null> {
  try {
    const res = await robustFetch(`${ZXC_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        'Referer': `${ZXC_BASE}/`,
        'Origin': ZXC_BASE,
      },
      body: JSON.stringify({ idd: tmdbId, f_token, ts: f_ts }),
    }, 1, 10000);

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchServerSource(
  serverId: number,
  tmdbId: string,
  mediaType: 'movie' | 'tv',
  imdbId: string,
  token: string,
  tokenTs: number,
  f_token: string,
  title: string,
  year: string,
  season?: string,
  episode?: string,
): Promise<{ success: boolean; link?: string; type?: string } | null> {
  try {
    let url = `${ZXC_BASE}/api/${serverId}?a=${tmdbId}&b=${mediaType}`;
    if (mediaType === 'tv') {
      url += `&c=${season}&d=${episode}`;
    }
    url += `&e=${imdbId}&gago=${tokenTs}&putanginamo=${token}&f_token=${f_token}&f=${encodeURIComponent(title)}&g=${year}`;

    const res = await robustFetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': `${ZXC_BASE}/`,
        'Origin': ZXC_BASE,
      },
    }, 1, 15000);

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function resolveLink(data: { link?: string; type?: string } | null): { url: string; type: string } | null {
  if (!data?.link) return null;
  const link = data.link.startsWith('/') ? `${ZXC_BASE}${data.link}` : data.link;
  const type = data.type === 'mp4' ? 'mp4' : 'hls';
  return { url: link, type };
}

export async function tryZxcPrime(path: string): Promise<{ sources: EmbedSource[], baseUrl: string } | null> {
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

    console.log('[Scraper] Trying zxcprime for:', path);

    // Get TMDB details for IMDB ID, title, year
    let imdbId = '';
    let title = '';
    let year = '';
    try {
      const details = await getMediaDetails(isTV ? 'tv' : 'movie', tmdbId);
      imdbId = isTV
        ? (details.external_ids?.imdb_id || details.imdb_id || '')
        : (details.imdb_id || details.external_ids?.imdb_id || '');
      title = isTV ? (details.name || '') : (details.title || '');
      year = isTV
        ? (details.first_air_date?.split('-')[0] || '')
        : (details.release_date?.split('-')[0] || '');
    } catch (e) {
      console.error('[Scraper] zxcprime TMDB lookup error:', e);
      return null;
    }

    if (!imdbId) {
      console.log('[Scraper] zxcprime: no IMDB ID found');
      return null;
    }

    // Get authentication tokens
    const { f_token, f_ts } = generateFrontendToken(tmdbId);
    const apiToken = await getApiToken(tmdbId, f_token, f_ts);
    if (!apiToken) {
      console.log('[Scraper] zxcprime: failed to get API token');
      return null;
    }

    // Fetch all servers in parallel
    const serverFetches = SERVERS.map(async (server) => {
      const data = await fetchServerSource(
        server.id, tmdbId, isTV ? 'tv' : 'movie', imdbId,
        apiToken.token, apiToken.ts, f_token,
        title, year, season, episode,
      );
      const resolved = resolveLink(data);
      if (!resolved) return null;

      return {
        id: 0,
        name: `ZXC ${server.name}`,
        quality: server.id === 2 ? '4K' : 'Auto',
        title: `ZXC ${server.name}`,
        url: resolved.url,
        type: resolved.type === 'mp4' ? 'mp4' : 'hls',
        useProxy: false,
        headers: {
          'Referer': `${ZXC_BASE}/`,
          'Origin': ZXC_BASE,
        },
      } as EmbedSource;
    });

    // Also fetch xpass servers (no token needed)
    const xpassFetches = [
      {
        name: 'ZXC Hypnos',
        getUrl: () => isTV
          ? `https://play.xpass.top/mov/${tmdbId}/${season}/${episode}/0/playlist.json`
          : `https://play.xpass.top/mov/${tmdbId}/0/0/0/playlist.json`,
      },
      {
        name: 'ZXC Kairos',
        getUrl: () => isTV
          ? `https://play.xpass.top/meg/tv/${tmdbId}/${season}/${episode}/playlist.json`
          : `https://play.xpass.top/meg/movie/${tmdbId}/0/0/playlist.json`,
      },
    ].map(async (xp) => {
      try {
        const res = await robustFetch(xp.getUrl(), {
          headers: { 'User-Agent': USER_AGENT },
        }, 1, 10000);
        if (!res.ok) return null;
        const data = await res.json();
        const source = data?.playlist?.at(-1)?.sources?.at(-1);
        if (!source?.file) return null;
        return {
          id: 0,
          name: xp.name,
          quality: 'Auto',
          title: xp.name,
          url: source.file,
          type: source.type === 'mp4' ? 'mp4' : 'hls',
          useProxy: false,
        } as EmbedSource;
      } catch {
        return null;
      }
    });

    const results = await Promise.allSettled([...serverFetches, ...xpassFetches]);

    const sources: EmbedSource[] = [];
    let sourceId = 1;
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        sources.push({ ...result.value, id: sourceId++ });
      }
    }

    console.log(`[Scraper] zxcprime found ${sources.length} sources`);
    return sources.length > 0 ? { sources, baseUrl: ZXC_BASE } : null;
  } catch (e) {
    console.error('[Scraper] zxcprime error:', e);
    return null;
  }
}
