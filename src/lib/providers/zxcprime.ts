import { EmbedSource, USER_AGENT, robustFetch } from './utils';
import { getMediaDetails } from '../tmdb';

const ZXC_BASE = 'https://www.zxcprime.icu';

// Servers that require a backend token
const TOKEN_SERVERS = [
  { id: 11, name: 'Icarus' },
  { id: 1,  name: 'Thanatos' },
  { id: 3,  name: 'Orion' },
  { id: 0,  name: 'Daedalus' },
  { id: 2,  name: 'Aether' },
  { id: 4,  name: 'Helios' },
  { id: 5,  name: 'Zephyr' },
  { id: 6,  name: 'Echo' },
  { id: 7,  name: 'Morpheus' },
];

// Xpass servers — no token needed, just tmdbId
const XPASS_SERVERS = [
  {
    id: 50,
    name: 'ZXC Hypnos',
    getUrl: (tmdbId: string, isTV: boolean, season?: string, episode?: string) =>
      isTV
        ? `https://play.xpass.top/mov/${tmdbId}/${season}/${episode}/0/playlist.json`
        : `https://play.xpass.top/mov/${tmdbId}/0/0/0/playlist.json`,
  },
  {
    id: 60,
    name: 'ZXC Kairos',
    getUrl: (tmdbId: string, isTV: boolean, season?: string, episode?: string) =>
      isTV
        ? `https://play.xpass.top/meg/tv/${tmdbId}/${season}/${episode}/playlist.json`
        : `https://play.xpass.top/meg/movie/${tmdbId}/0/0/playlist.json`,
  },
  {
    id: 70,
    name: 'ZXC Atlas',
    getUrl: (tmdbId: string, isTV: boolean, season?: string, episode?: string) =>
      isTV
        ? `https://play.xpass.top/box/tv/${tmdbId}/${season}/${episode}/playlist.json`
        : `https://play.xpass.top/box/movie/${tmdbId}/0/0/playlist.json`,
  },
];

async function getApiToken(
  tmdbId: string,
  mediaType: 'movie' | 'tv',
  imdbId: string,
  title: string,
  year: string,
  season?: string,
  episode?: string,
): Promise<{ token: string; signature: string } | null> {
  try {
    const body: Record<string, string> = {
      id: tmdbId,
      media_type: mediaType,
      imdbId,
      title,
      year,
    };
    if (mediaType === 'tv' && season) body.season = season;
    if (mediaType === 'tv' && episode) body.episode = episode;

    const res = await robustFetch(`${ZXC_BASE}/zxcprime-backend/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        'Referer': `${ZXC_BASE}/`,
        'Origin': ZXC_BASE,
      },
      body: JSON.stringify(body),
    }, 1, 10000);

    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.token || !data?.signature) return null;
    return { token: data.token, signature: data.signature };
  } catch {
    return null;
  }
}

async function fetchTokenServer(
  serverId: number,
  serverName: string,
  tmdbId: string,
  mediaType: 'movie' | 'tv',
  imdbId: string,
  title: string,
  year: string,
  season?: string,
  episode?: string,
): Promise<EmbedSource | null> {
  try {
    const apiToken = await getApiToken(tmdbId, mediaType, imdbId, title, year, season, episode);
    if (!apiToken) return null;

    const encodedToken = encodeURIComponent(apiToken.token);
    const url = `${ZXC_BASE}/zxcprime-backend/${serverId}?data=${encodedToken}&sig=${apiToken.signature}`;

    const res = await robustFetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': `${ZXC_BASE}/`,
        'Origin': ZXC_BASE,
      },
    }, 1, 15000);

    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.link || data.link.includes('/video/error') || data.success === false) return null;

    const link: string = data.link.startsWith('/') ? `${ZXC_BASE}${data.link}` : data.link;
    const type = data.type === 'mp4' ? 'mp4' : 'hls';

    return {
      id: 0,
      name: `ZXC ${serverName}`,
      quality: serverId === 2 ? '4K' : 'Auto',
      title: `ZXC ${serverName}`,
      url: link,
      type,
      useProxy: false,
      headers: {
        'Referer': `${ZXC_BASE}/`,
        'Origin': ZXC_BASE,
      },
    } as EmbedSource;
  } catch {
    return null;
  }
}

async function fetchXpassServer(
  server: typeof XPASS_SERVERS[0],
  tmdbId: string,
  isTV: boolean,
  season?: string,
  episode?: string,
): Promise<EmbedSource | null> {
  try {
    const url = server.getUrl(tmdbId, isTV, season, episode);
    const res = await robustFetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    }, 1, 10000);
    if (!res.ok) return null;
    const data = await res.json();
    const source = data?.playlist?.at(-1)?.sources?.at(-1);
    if (!source?.file) return null;

    return {
      id: 0,
      name: server.name,
      quality: 'Auto',
      title: server.name,
      url: source.file,
      type: source.type === 'mp4' ? 'mp4' : 'hls',
      useProxy: false,
    } as EmbedSource;
  } catch {
    return null;
  }
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

    // Get TMDB details for imdbId, title, year
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

    // Each token server needs its own fresh token (tokens are single-use)
    const tokenServerFetches = TOKEN_SERVERS.map((server) =>
      fetchTokenServer(
        server.id,
        server.name,
        tmdbId,
        isTV ? 'tv' : 'movie',
        imdbId,
        title,
        year,
        season,
        episode,
      )
    );

    // Xpass servers use tmdbId directly — no token needed
    const xpassFetches = XPASS_SERVERS.map((server) =>
      fetchXpassServer(server, tmdbId, isTV, season, episode)
    );

    const results = await Promise.allSettled([...tokenServerFetches, ...xpassFetches]);

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
