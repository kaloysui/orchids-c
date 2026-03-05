import { EmbedSource, USER_AGENT, robustFetch } from './utils';

const AMRI_BASE = 'https://amri.gg';
const AMRI_API_KEY = 'your-shared-secret';
const AMRI_TIMEOUT_SESSION = 6000;
const AMRI_TIMEOUT_SOURCES = 12000;
const AMRI_MAX_SOURCES = 10;

function parseQuality(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('2160p') || t.includes('4k') || t.includes('uhd')) return '4K';
  if (t.includes('1080p')) return '1080p';
  if (t.includes('720p')) return '720p';
  if (t.includes('480p')) return '480p';
  return 'SD';
}

function getSourceType(url: string): 'mp4' | 'avi' | 'video' {
  const u = url.split('?')[0].toLowerCase();
  if (u.endsWith('.mp4')) return 'mp4';
  if (u.endsWith('.avi')) return 'avi';
  return 'video';
}

function isUsable(url: string): boolean {
  if (!url) return false;
  if (url.includes('failed_rar') || url.includes('placeholder')) return false;
  const ext = url.split('?')[0].toLowerCase().split('.').pop() ?? '';
  // Only allow mp4 and avi
  if (!['mp4', 'avi'].includes(ext)) return false;
  return true;
}

export async function tryAmri(
  path: string
): Promise<{ sources: EmbedSource[]; baseUrl: string } | null> {
  // Shared abort controller so both fetches cancel together on timeout
  const controller = new AbortController();
  const globalTimeout = setTimeout(() => controller.abort(), AMRI_TIMEOUT_SOURCES + AMRI_TIMEOUT_SESSION + 2000);

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

    const commonHeaders = {
      'User-Agent': USER_AGENT,
      'X-API-Key': AMRI_API_KEY,
      'Authorization': `Bearer ${AMRI_API_KEY}`,
      'Referer': `${AMRI_BASE}/`,
      'Origin': AMRI_BASE,
    };

    // Session fetch
    const sessionRes = await robustFetch(
      `${AMRI_BASE}/api/session`,
      { method: 'GET', headers: commonHeaders, signal: controller.signal },
      1,
      AMRI_TIMEOUT_SESSION
    );

    if (!sessionRes.ok) {
      console.log('[Scraper] amri: session failed', sessionRes.status);
      return null;
    }

    // Drain session body to free connection
    await sessionRes.text().catch(() => {});

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
          ...commonHeaders,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        signal: controller.signal,
      },
      1,
      AMRI_TIMEOUT_SOURCES
    );

    if (!sourcesRes.ok) {
      console.log('[Scraper] amri: sources fetch failed', sourcesRes.status);
      await sourcesRes.text().catch(() => {});
      return null;
    }

    // Guard against huge responses (>2MB)
    const contentLength = sourcesRes.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) {
      console.log('[Scraper] amri: response too large, skipping');
      await sourcesRes.text().catch(() => {});
      return null;
    }

    let data: any;
    try {
      const text = await sourcesRes.text();
      if (text.length > 2 * 1024 * 1024) {
        console.log('[Scraper] amri: response body too large, skipping');
        return null;
      }
      data = JSON.parse(text);
    } catch {
      console.log('[Scraper] amri: invalid JSON response');
      return null;
    }

    const raw: Array<{ url: string; title: string; type: string }> = data?.sources ?? [];
    if (!raw.length) return null;

    const seen = new Set<string>();
    const sources: EmbedSource[] = [];

    for (const item of raw) {
      const url = item.url?.trim();
      if (!url || seen.has(url)) continue;
      if (!isUsable(url)) continue;
      seen.add(url);

      const quality = parseQuality(item.title ?? '');
      const type = getSourceType(url);
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

      if (sources.length >= AMRI_MAX_SOURCES) break;
    }

    console.log(`[Scraper] amri found ${sources.length} sources`);
    return sources.length > 0 ? { sources, baseUrl: AMRI_BASE } : null;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      console.log('[Scraper] amri: request aborted (timeout)');
    } else {
      console.error('[Scraper] amri error:', e);
    }
    return null;
  } finally {
    clearTimeout(globalTimeout);
  }
}
