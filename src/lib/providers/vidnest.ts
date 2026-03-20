import { EmbedSource, USER_AGENT, robustFetch } from './utils';

const BASE = 'https://new.vidnest.fun';
const REFERER = 'https://vidnest.fun/';

// Custom base64 alphabet used by vidnest's decryptCipherResponse
const VIDNEST_ALPHABET = 'RB0fpH8ZEyVLkv7c2i6MAJ5u3IKFDxlS1NTsnGaqmXYdUrtzjwObCgQP94hoeW+/=';

function decodeVidnest(encoded: string): any {
  const s: Record<string, number> = {};
  for (let i = 0; i < VIDNEST_ALPHABET.length; i++) s[VIDNEST_ALPHABET[i]] = i;

  const result: number[] = [];
  for (let t = 0; t < encoded.length; t += 4) {
    let o = encoded.slice(t, t + 4);
    while (o.length < 4) o += '=';
    const l: number[] = [];
    for (let e = 0; e < 4; e++) {
      const v = s[o[e]];
      l.push(v !== undefined ? v : 64);
    }
    result.push((l[0] << 2) | (l[1] >> 4));
    if (l[2] !== 64) result.push(((l[1] & 15) << 4) | (l[2] >> 2));
    if (l[3] !== 64) result.push(((l[2] & 3) << 6) | l[3]);
  }

  const text = new TextDecoder().decode(new Uint8Array(result));
  try { return JSON.parse(text); } catch { return text; }
}

async function fetchAndDecode(url: string): Promise<any | null> {
  try {
    const res = await robustFetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Referer': REFERER,
        'Origin': 'https://vidnest.fun',
      },
    }, 1, 12000);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.encrypted && typeof json.data === 'string') {
      return decodeVidnest(json.data);
    }
    return json;
  } catch {
    return null;
  }
}

// Response-shape handlers — each returns EmbedSource[] or []
function parseOnehd(data: any, name: string): EmbedSource[] {
  // { url, headers?, subtitles? }
  if (!data?.url) return [];
  return [{
    id: 0, name, quality: 'auto', title: name,
    url: data.url,
    type: data.url.includes('.m3u8') ? 'hls' : 'mp4',
    useProxy: true,
    headers: data.headers || {},
  }];
}

function parseSigma(data: any, name: string): EmbedSource[] {
  // { sources: [{ file, label, type }] }
  if (!Array.isArray(data?.sources)) return [];
  return data.sources
    .filter((s: any) => s?.file)
    .map((s: any) => ({
      id: 0, name, quality: s.label || 'auto', title: `${name} (${s.label || 'auto'})`,
      url: s.file,
      type: s.type === 'hls' || s.file.includes('.m3u8') ? 'hls' : 'mp4',
      useProxy: true,
      headers: {},
    }));
}

function parseStreams(data: any, name: string): EmbedSource[] {
  // { streams: [{ url, type, language, headers? }] }
  if (!Array.isArray(data?.streams)) return [];
  return data.streams
    .filter((s: any) => s?.url)
    .map((s: any) => ({
      id: 0, name, quality: s.quality || s.language || 'auto',
      title: `${name} (${s.language || s.quality || 'auto'})`,
      url: s.url,
      type: s.type === 'hls' || s.url.includes('.m3u8') ? 'hls' : 'mp4',
      useProxy: true,
      headers: s.headers || {},
    }));
}

function parseMoviebox(data: any, name: string): EmbedSource[] {
  // { url: [{ link, resolution, type }], headers? }
  if (!Array.isArray(data?.url)) return [];
  return data.url
    .filter((u: any) => u?.link)
    .map((u: any) => ({
      id: 0, name, quality: u.resolution || 'auto', title: `${name} (${u.resolution || 'auto'}p)`,
      url: u.link,
      type: u.link.includes('.m3u8') ? 'hls' : 'mp4',
      useProxy: true,
      headers: data.headers || {},
    }));
}

function parseHexa(data: any, name: string): EmbedSource[] {
  // { data: { stream: { playlist, captions? } }, headers? }
  const playlist = data?.data?.stream?.playlist;
  if (!playlist) return [];
  return [{
    id: 0, name, quality: 'auto', title: name,
    url: playlist,
    type: 'hls',
    useProxy: true,
    headers: data.headers || {},
  }];
}

// Server definitions
interface ServerDef {
  name: string;
  movie: string;
  tv: string;
  parse: (data: any, name: string) => EmbedSource[];
  movieSuffix?: string;
  tvSuffix?: string;
}

const SERVERS: ServerDef[] = [
  {
    name: 'VidNest Sigma',
    movie: `${BASE}/hollymoviehd/movie`,
    tv: `${BASE}/hollymoviehd/tv`,
    parse: parseSigma,
  },
  {
    name: 'VidNest Alfa',
    movie: `${BASE}/onehd/movie`,
    tv: `${BASE}/onehd/tv`,
    parse: parseOnehd,
    movieSuffix: '?server=upcloud',
    tvSuffix: '?server=upcloud',
  },
  {
    name: 'VidNest Catflix',
    movie: `${BASE}/moviebox/movie`,
    tv: `${BASE}/moviebox/tv`,
    parse: parseMoviebox,
  },
  {
    name: 'VidNest Hexa',
    movie: `${BASE}/vidlink/movie`,
    tv: `${BASE}/vidlink/tv`,
    parse: parseHexa,
  },
  {
    name: 'VidNest Ophim',
    movie: `${BASE}/ophim/movie`,
    tv: `${BASE}/ophim/tv`,
    parse: parseStreams,
  },
  {
    name: 'VidNest Lamda',
    movie: `${BASE}/allmovies/movie`,
    tv: `${BASE}/allmovies/tv`,
    parse: parseStreams,
  },
];

export async function tryVidnest(
  path: string
): Promise<{ sources: EmbedSource[]; baseUrl: string } | null> {
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

    console.log('[Scraper] Trying vidnest for:', path);

    const fetchServer = async (server: ServerDef): Promise<EmbedSource[]> => {
      try {
        const baseUrl = isTV ? server.tv : server.movie;
        const suffix = isTV
          ? (server.tvSuffix || '')
          : (server.movieSuffix || '');
        const url = isTV
          ? `${baseUrl}/${tmdbId}/${season}/${episode}${suffix}`
          : `${baseUrl}/${tmdbId}${suffix}`;

        const data = await fetchAndDecode(url);
        if (!data) return [];

        const sources = server.parse(data, server.name);
        return sources;
      } catch (e) {
        console.log(`[Vidnest] ${server.name} error:`, e);
        return [];
      }
    };

    const results = await Promise.allSettled(SERVERS.map(s => fetchServer(s)));

    const sources: EmbedSource[] = [];
    let id = 1;
    for (const r of results) {
      if (r.status === 'fulfilled') {
        for (const s of r.value) {
          sources.push({ ...s, id: id++ });
        }
      }
    }

    console.log(`[Scraper] vidnest found ${sources.length} sources`);
    return sources.length > 0 ? { sources, baseUrl: 'https://vidnest.fun' } : null;
  } catch (e) {
    console.error('[Scraper] vidnest error:', e);
    return null;
  }
}
