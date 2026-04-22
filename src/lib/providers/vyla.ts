import { EmbedSource, USER_AGENT, robustFetch } from './utils';

const VYLA_BASE = 'https://vyla-api.pages.dev';
const VYLA_TIMEOUT = 5000;

interface VylaSource {
  url: string;
  type?: string;
  quality?: string;
  provider?: string;
  headers?: Record<string, string>;
}

interface VylaSubtitle {
  url: string;
  label?: string;
  format?: string;
}

interface VylaResponse {
  success: boolean;
  sources?: VylaSource[];
  subtitles?: VylaSubtitle[];
}

export async function tryVyla(path: string): Promise<{ sources: EmbedSource[]; baseUrl: string } | null> {
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
      ? `${VYLA_BASE}/api/tv?id=${tmdbId}&season=${season}&episode=${episode}`
      : `${VYLA_BASE}/api/movie?id=${tmdbId}`;

    console.log('[Scraper] Trying vyla for:', path);

    const res = await robustFetch(apiUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json, */*',
      },
    }, 1, VYLA_TIMEOUT);

    if (!res.ok) return null;

    const data: VylaResponse = await res.json();

    if (!data.success || !data.sources || data.sources.length === 0) {
      return null;
    }

    const subtitles = data.subtitles?.map((s) => ({
      file: s.url,
      label: s.label || 'Unknown',
      kind: 'subtitles',
    })) ?? [];

    let id = 1;

    const sources: EmbedSource[] = data.sources
      .filter((s) => s.url)
      .map((s) => ({
        id: id++,
        name: `Vyla ${s.provider || ''}`.trim(),
        title: `Vyla ${s.provider || ''}`.trim(),
        url: s.url,
        type: s.type || (s.url.includes('.m3u8') ? 'hls' : 'mp4'),
        quality: s.quality || 'Auto',
        headers: s.headers,
        ...(subtitles.length > 0 ? { subtitles } : {}),
        useProxy: false,
      }));

    console.log(`[Scraper] vyla found ${sources.length} sources`);

    return sources.length > 0
      ? { sources, baseUrl: VYLA_BASE }
      : null;

  } catch (e) {
    console.error('[Scraper] vyla error:', e);
    return null;
  }
}
