import { EmbedSource, robustFetch, USER_AGENT } from './utils';

const PROXY_BASE = 'https://proxy50.peachify.top';
const REFERER = 'https://peachify.top/';
const PROVIDERS = ['moviebox', 'myflixerz'] as const;
const MAX_SOURCES = 100;

function parseQuality(q: number | string | undefined): string {
  const n = typeof q === 'number' ? q : parseInt(String(q ?? '0'), 10);
  if (n >= 2160) return '4K';
  if (n >= 1080) return '1080p';
  if (n >= 720) return '720p';
  if (n >= 480) return '480p';
  if (n >= 360) return '360p';
  return 'SD';
}

function getType(url: string): 'mp4' | 'm3u8' | 'video' {
  const u = url.split('?')[0].toLowerCase();
  if (u.endsWith('.mp4')) return 'mp4';
  if (u.endsWith('.m3u8') || u.includes('m3u8')) return 'm3u8';
  return 'video';
}

async function fetchProvider(
  provider: string,
  type: 'movie' | 'tv',
  id: string,
  season?: string,
  episode?: string,
): Promise<EmbedSource[]> {
  let url = `${PROXY_BASE}/${provider}/${type}/${id}`;
  if (type === 'tv') url += `/${season}/${episode}`;

  const res = await robustFetch(
    url,
    {
      headers: {
        'User-Agent': USER_AGENT,
        Referer: REFERER,
        Origin: 'https://peachify.top',
      },
    },
    1,
    12000,
  );

  if (!res.ok) return [];

  let data: any;
  try {
    data = await res.json();
  } catch {
    return [];
  }

  const raw: any[] = Array.isArray(data?.sources) ? data.sources : [];
  const sources: EmbedSource[] = [];

  for (const item of raw) {
    const srcUrl: string = item?.url?.trim();
    if (!srcUrl) continue;

    const quality = parseQuality(item.quality);
    const srcType = getType(srcUrl);
    const dub: string = item?.dub ?? 'English';

    sources.push({
      id: sources.length + 1,
      name: `Peachify ${quality}`,
      quality,
      title: `${provider} ${quality}${dub && dub !== 'Original Audio' ? ` [${dub}]` : ''}`,
      url: srcUrl,
      type: srcType,
      lang: dub,
      headers: item.headers ?? undefined,
    });
  }

  return sources;
}

export async function tryPeachify(
  path: string,
): Promise<{ sources: EmbedSource[]; baseUrl: string } | null> {
  const isTV = path.startsWith('tv/');
  let type: 'movie' | 'tv';
  let id: string;
  let season: string | undefined;
  let episode: string | undefined;

  if (isTV) {
    const parts = path.replace('tv/', '').split('/');
    type = 'tv';
    id = parts[0];
    season = parts[1] ?? '1';
    episode = parts[2] ?? '1';
  } else {
    type = 'movie';
    id = path.replace('movie/', '');
  }

  const results = await Promise.allSettled(
    PROVIDERS.map((p) => fetchProvider(p, type, id, season, episode)),
  );

  const allSources: EmbedSource[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    for (const src of result.value) {
      if (seen.has(src.url)) continue;
      seen.add(src.url);
      allSources.push({ ...src, id: allSources.length + 1 });
    }
  }

  console.log(`[Scraper] peachify found ${allSources.length} sources`);
  return allSources.length > 0 ? { sources: allSources, baseUrl: REFERER } : null;
}
