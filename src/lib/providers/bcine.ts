import { EmbedSource, USER_AGENT, robustFetch } from './utils';
import { getMediaDetails } from '../tmdb';

export async function tryBCine(path: string): Promise<{ sources: EmbedSource[], baseUrl: string } | null> {
  try {
    const isTV = path.startsWith('tv/');
    let id: string;
    let season: string | undefined;
    let episode: string | undefined;

    if (isTV) {
      const parts = path.replace('tv/', '').split('/');
      id = parts[0];
      season = parts[1] || '1';
      episode = parts[2] || '1';
    } else {
      id = path.replace('movie/', '');
    }

    let imdbId = id;
    if (!id.startsWith('tt') && !isNaN(Number(id))) {
      try {
        const details = await getMediaDetails(isTV ? 'tv' : 'movie', id);
        imdbId = isTV 
          ? (details.external_ids?.imdb_id || details.imdb_id)
          : (details.imdb_id || details.external_ids?.imdb_id);
        
        if (!imdbId) {
          console.error('[Scraper] bCine: Could not find IMDB ID for TMDB ID:', id);
          return null;
        }
      } catch (e) {
        console.error('[Scraper] bCine TMDB lookup error:', e);
        return null;
      }
    }
    
    // Test multiple bCine domains
    const domains = ['scrennnifu.click', 'bcine.click', 'bcine.xyz'];
    const sources: EmbedSource[] = [];
    
    // For bCine, we usually just return the URL because it's a direct m3u8 generator
    // but we can at least check if the domain is reachable
    
    const playlistUrl = isTV 
      ? `https://scrennnifu.click/serial/${imdbId}/${season}/${episode}/playlist.m3u8`
      : `https://scrennnifu.click/movie/${imdbId}/playlist.m3u8`;
    
    console.log('[Scraper] Returning bCine source:', playlistUrl);

    sources.push({
      id: 1,
      name: 'bCine',
      quality: 'Auto',
      title: 'bCine (Playlist)',
      url: playlistUrl,
      type: 'hls',
      useProxy: false,
      flag: 'US',
      headers: {
        'Referer': 'https://scrennnifu.click/',
        'Origin': 'https://scrennnifu.click'
      }
    });

    return { sources, baseUrl: 'https://scrennnifu.click' };
  } catch (e) {
    console.error('[Scraper] bCine error:', e);
    return null;
  }
}
