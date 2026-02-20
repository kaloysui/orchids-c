import { EmbedSource, USER_AGENT, robustFetch } from './utils';

const AMRI_BASE = 'https://amri.gg';
const AMRI_API_KEY = 'your-shared-secret';

/** Extract quality label from a torrent title string */
function parseQuality(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('2160p') || t.includes('4k') || t.includes('uhd')) return '4K';
  if (t.includes('1080p')) return '1080p';
  if (t.includes('720p')) return '720p';
  if (t.includes('480p')) return '480p';
  return 'SD';
}

/** Determine if URL is mp4 or some other direct video */
function getSourceType(url: string): 'mp4' | 'video' {
  const u = url.split('?')[0].toLowerCase();
  if (u.endsWith('.mp4')) return 'mp4';
  return 'video';
}

/** Filter to English-preferring sources (skip obvious non-English-only if multi-audio present) */
function isUsable(title: string, url: string): boolean {
  // Skip failed/placeholder URLs
  if (url.includes('failed_rar') || url.includes('placeholder')) return false;
  // Skip non-mp4 formats (mkv, avi, etc.) — mp4 only
  const ext = url.split('?')[0].toLowerCase().split('.').pop() ?? '';
  if (ext && ext !== 'mp4' && ['mkv', 'mov', 'wmv', 'flv', 'webm', 'ts'].includes(ext)) return false;
  return true;
}

export async function tryAmri(
  path: string
): Promise<{ sources: EmbedSource[]; baseUrl: string } | null> {
  try {
    const isTV = path.startsWith('tv/');
    let apiUrl: string;

    if (isTV) {
      const parts = path.replace('tv/', '').split('/');
      const id = parts[0];
      const season = parts[1] || '1';
      const episode = parts[2] || '1';
      apiUrl = `${AMRI_BASE}/api/sources?tmdb=${id}&season=${season}&episode=${episode}`;
    } else {
      const id = path.replace('movie/', '');
      apiUrl = `${AMRI_BASE}/api/sources?tmdb=${id}`;
    }

    // Establish session (sets auth cookie equivalent via header)
    const sessionRes = await robustFetch(
      `${AMRI_BASE}/api/session`,
      {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'X-API-Key': AMRI_API_KEY,
          'Authorization': `Bearer ${AMRI_API_KEY}`,
          'Referer': `${AMRI_BASE}/`,
          'Origin': AMRI_BASE,
        },
      },
      1,
      8000
    );

    if (!sessionRes.ok) {
      console.log('[Scraper] amri: session failed', sessionRes.status);
      return null;
    }

    // Extract session cookie to pass on the next request
    const setCookie = sessionRes.headers.get('set-cookie') ?? '';
    const cookieHeader = setCookie
      .split(',')
      .map((c) => c.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');

    const sourcesRes = await robustFetch(
      apiUrl,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'X-API-Key': AMRI_API_KEY,
          'Authorization': `Bearer ${AMRI_API_KEY}`,
          'Referer': `${AMRI_BASE}/`,
          'Origin': AMRI_BASE,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      },
      1,
      15000
    );

    if (!sourcesRes.ok) {
      console.log('[Scraper] amri: sources fetch failed', sourcesRes.status);
      return null;
    }

    const data = await sourcesRes.json();
    const raw: Array<{ url: string; title: string; type: string }> = data.sources ?? [];

    if (!raw.length) return null;

    // Filter, deduplicate URLs, limit to prevent flooding the player
    const seen = new Set<string>();
    const sources: EmbedSource[] = [];

    for (const item of raw) {
      const url = item.url?.trim();
      if (!url || seen.has(url)) continue;
      if (!isUsable(item.title ?? '', url)) continue;
      seen.add(url);

      const quality = parseQuality(item.title ?? '');
      const type = getSourceType(url);
      // Use first line of title (before newline) as a clean label
      const cleanTitle = (item.title ?? '').split('\n')[0].trim();

      sources.push({
        id: sources.length + 1,
        name: `Amri ${quality}`,
        quality,
        title: cleanTitle,
        url,
        type,
        lang: 'English',
      });

      // Cap at 20 sources to keep the player manageable
      if (sources.length >= 20) break;
    }

    console.log(`[Scraper] amri found ${sources.length} sources`);
    return sources.length > 0 ? { sources, baseUrl: AMRI_BASE } : null;
  } catch (e) {
    console.error('[Scraper] amri error:', e);
    return null;
  }
}
