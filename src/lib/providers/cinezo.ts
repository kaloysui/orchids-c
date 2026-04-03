import { EmbedSource, USER_AGENT, robustFetch } from './utils';

const CINEZO_BASE = 'https://api.cinezo.net';
const CINEZO_TIMEOUT = 10000;

const SERVERS = [
  { id: 'nexo',        name: 'Cinezo Nexo' },
  { id: 'mega',        name: 'Cinezo Mega' },
  { id: 'vflix',       name: 'Cinezo Vflix' },
  { id: 'vfast',       name: 'Cinezo Vfast' },
  { id: 'neon',        name: 'Cinezo Neon' },
  { id: 'sage',        name: 'Cinezo Sage' },
  { id: 'cypher',      name: 'Cinezo Cypher' },
  { id: 'yoru',        name: 'Cinezo Yoru' },
  { id: 'reyna',       name: 'Cinezo Reyna' },
  { id: 'omen',        name: 'Cinezo Omen' },
  { id: 'Breach',      name: 'Cinezo Breach' },
  { id: 'Vyse',        name: 'Cinezo Vyse' },
  { id: 'Killjoy',     name: 'Cinezo Killjoy' },
  { id: 'harbor',      name: 'Cinezo Harbor' },
  { id: 'chamber',     name: 'Cinezo Chamber' },
  { id: 'fade',        name: 'Cinezo Fade' },
  { id: 'gekko',       name: 'Cinezo Gekko' },
  { id: 'kayo',        name: 'Cinezo Kayo' },
  { id: 'raze',        name: 'Cinezo Raze' },
  { id: 'phoenix',     name: 'Cinezo Phoenix' },
  { id: 'astra',       name: 'Cinezo Astra' },
  { id: 'Hindi',       name: 'Cinezo Hindi',       lang: 'hi' },
  { id: 'tamil',       name: 'Cinezo Tamil',       lang: 'ta' },
  { id: 'bengali',     name: 'Cinezo Bengali',     lang: 'bn' },
  { id: 'Kannada',     name: 'Cinezo Kannada',     lang: 'kn' },
  { id: 'Telugu',      name: 'Cinezo Telugu',      lang: 'te' },
  { id: 'hindisubbed', name: 'Cinezo Hindi Sub',   lang: 'hi' },
];

// Actual cinezo response shape:
// { sources: [{ url: string, dub?: string, lang?: string, subtitles?: [...] }], server: string }
interface CinezoSource {
  url?: string;
  dub?: string;
  lang?: string;
  subtitles?: Array<{
    id?: string;
    url?: string;
    language?: string;
    type?: string;
    hasCorsRestrictions?: boolean;
  }>;
}

interface CinezoResponse {
  sources?: CinezoSource[];
  server?: string;
}

async function fetchServer(
  serverName: string,
  apiUrl: string,
  forceLang?: string,
): Promise<EmbedSource | null> {
  try {
    const res = await robustFetch(apiUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': `${CINEZO_BASE}/`,
        'Origin': CINEZO_BASE,
        'Accept': 'application/json, */*',
      },
    }, 1, CINEZO_TIMEOUT);

    if (!res.ok) return null;

    const data: CinezoResponse = await res.json();

    if (!data.sources || data.sources.length === 0) return null;

    const src = data.sources[0];
    const streamUrl = src?.url;

    if (!streamUrl || typeof streamUrl !== 'string') return null;

    const type = streamUrl.includes('.m3u8') ? 'hls' : 'mp4';
    const lang = forceLang || src.lang || src.dub || undefined;

    const subtitles = src.subtitles?.map((s) => ({
      file: s.url || s.id,
      label: s.language || 'Unknown',
      kind: 'subtitles',
    })) ?? [];

    return {
      id: 0,
      name: serverName,
      quality: 'Auto',
      title: serverName,
      url: streamUrl,
      type,
      ...(lang ? { lang } : {}),
      ...(subtitles.length > 0 ? { subtitles } : {}),
      useProxy: false,
    } as EmbedSource;
  } catch {
    return null;
  }
}

export async function tryCinezo(path: string): Promise<{ sources: EmbedSource[]; baseUrl: string } | null> {
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

    console.log('[Scraper] Trying cinezo for:', path);

    const fetches = SERVERS.map((server) => {
      const apiUrl = isTV
        ? `${CINEZO_BASE}/api/tv/${tmdbId}/${season}/${episode}/${server.id}`
        : `${CINEZO_BASE}/api/movie/${tmdbId}/${server.id}`;

      return fetchServer(server.name, apiUrl, server.lang);
    });

    const results = await Promise.allSettled(fetches);

    const sources: EmbedSource[] = [];
    let sourceId = 1;
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        sources.push({ ...result.value, id: sourceId++ });
      }
    }

    console.log(`[Scraper] cinezo found ${sources.length} sources`);
    return sources.length > 0 ? { sources, baseUrl: CINEZO_BASE } : null;
  } catch (e) {
    console.error('[Scraper] cinezo error:', e);
    return null;
  }
}
