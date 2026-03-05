import { EmbedSource, USER_AGENT, robustFetch } from './utils';

const VIDEASY_API = 'https://api2.videasy.net';
const DECRYPT_API = 'https://enc-dec.app/api/dec-videasy';
const TMDB_API_KEY = '3e20e76d6d210b6cb128d17d233b64dc';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const SERVERS = [
  'myflixerzupcloud',
  'myflixerzvidcloud',
  'vidsrcto',
  'filmxylama',
];

interface TMDBMovieInfo {
  title: string;
  release_date: string;
}

interface TMDBTVInfo {
  name: string;
  first_air_date: string;
}

async function getTMDBInfo(tmdbId: string, isTV: boolean): Promise<{ title: string; year: string } | null> {
  try {
    const endpoint = isTV ? 'tv' : 'movie';
    const res = await fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}`, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    if (isTV) {
      const tvData = data as TMDBTVInfo;
      return {
        title: tvData.name,
        year: tvData.first_air_date?.split('-')[0] || ''
      };
    } else {
      const movieData = data as TMDBMovieInfo;
      return {
        title: movieData.title,
        year: movieData.release_date?.split('-')[0] || ''
      };
    }
  } catch {
    return null;
  }
}

async function decryptVideasy(encrypted: string, tmdbId: string): Promise<any> {
  try {
    const res = await robustFetch(DECRYPT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT
      },
      body: JSON.stringify({ text: encrypted, id: tmdbId })
    }, 1, 15000);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.status !== 200) return null;
    
    return data.result;
  } catch {
    return null;
  }
}

export async function tryVideasy(path: string): Promise<{ sources: EmbedSource[], baseUrl: string } | null> {
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
    
    console.log('[Scraper] Trying videasy for:', path);
    
    const tmdbInfo = await getTMDBInfo(tmdbId, isTV);
    if (!tmdbInfo) {
      console.log('[Scraper] videasy: Could not get TMDB info');
      return null;
    }
    
    const results = await Promise.allSettled(SERVERS.map(async (server) => {
      try {
        const qs = new URLSearchParams({
          title: tmdbInfo.title,
          mediaType: isTV ? 'tv' : 'movie',
          year: tmdbInfo.year,
          tmdbId: tmdbId
        });
        
        if (isTV) {
          qs.set('seasonId', season!);
          qs.set('episodeId', episode!);
        }
        
        const apiUrl = `${VIDEASY_API}/${server}/sources-with-title?${qs}`;
        
        const res = await robustFetch(apiUrl, {
          method: 'GET',
          headers: { 'User-Agent': USER_AGENT }
        }, 1, 10000);
        
        if (!res.ok) return [];
        
        const encrypted = await res.text();
        if (!encrypted || encrypted.length < 100) return [];
        
        const decrypted = await decryptVideasy(encrypted, tmdbId);
        if (!decrypted || !decrypted.sources) return [];
        
        const serverSources: EmbedSource[] = [];
        for (const source of decrypted.sources) {
          if (source.url) {
            serverSources.push({
              id: 0, // Will be reassigned
              name: `${server} (${source.quality})`,
              quality: source.quality || 'HD',
              title: `${server} - ${source.quality || 'HD'}`,
              url: source.url,
              type: 'hls',
              useProxy: true,
              headers: {
                'Origin': 'https://videasy.net',
                'Referer': 'https://videasy.net/'
              }
            });
          }
        }
        return serverSources;
      } catch (e) {
        console.log(`[Scraper] videasy ${server} error:`, e);
        return [];
      }
    }));
    
    const sources: EmbedSource[] = [];
    let sourceId = 1;
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const s of result.value) {
          sources.push({ ...s, id: sourceId++ });
        }
      }
    }
    
    console.log(`[Scraper] videasy found ${sources.length} sources`);
    return sources.length > 0 ? { sources, baseUrl: 'https://videasy.net' } : null;
  } catch (e) {
    console.error('[Scraper] videasy error:', e);
    return null;
  }
}
