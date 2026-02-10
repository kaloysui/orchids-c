import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const TMDB_API_KEY = '3e20e76d6d210b6cb128d17d233b64dc';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const BASE_URL = 'https://a.111477.xyz';

interface MediaItem {
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
}

interface DownloadFile {
  url: string;
  name: string;
  size: string;
  quality: string;
  episode?: number;
  episodeTitle?: string;
}

interface SeasonInfo {
  seasonNumber: number;
  episodes: DownloadFile[];
}

function extractQuality(filename: string): string {
  if (filename.includes('2160p') || filename.includes('4K') || filename.includes('UHD')) return '4K';
  if (filename.includes('1080p')) return '1080p';
  if (filename.includes('720p')) return '720p';
  if (filename.includes('480p')) return '480p';
  return 'Unknown';
}

function extractEpisodeNumber(filename: string): number | null {
  const match = filename.match(/S\d{1,2}E(\d{1,2})/i) || filename.match(/E(\d{1,2})/i);
  return match ? parseInt(match[1]) : null;
}

function formatSize(sizeStr: string): string {
  return sizeStr || 'Unknown';
}

async function fetchPage(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    return await res.text();
  } catch {
    return '';
  }
}

function parseRows(html: string): { dataName: string; dataUrl: string; size: string }[] {
  const rows: { dataName: string; dataUrl: string; size: string }[] = [];
  const rowRegex = /<tr[^>]*data-entry="true"[^>]*data-name="([^"]*)"[^>]*data-url="([^"]*)"[^>]*>[\s\S]*?<td[^>]*class="size"[^>]*>([^<]*)</gi;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    rows.push({ dataName: match[1], dataUrl: match[2], size: match[3].trim() });
  }
  return rows;
}

function findShowFolder(rows: { dataName: string; dataUrl: string }[], searchName: string): string | null {
  const searchNormalized = searchName.toLowerCase();
  const searchWords = searchNormalized.split(' ').filter(w => w.length > 2);
  
  let match = rows.find(r => r.dataName.toLowerCase().includes(searchNormalized));
  if (match) return match.dataUrl;
  
  match = rows.find(r => {
    const normalized = r.dataName.toLowerCase();
    const matchCount = searchWords.filter(word => normalized.includes(word)).length;
    return matchCount >= Math.ceil(searchWords.length * 0.6);
  });
  if (match) return match.dataUrl;
  
  match = rows.find(r => r.dataName.toLowerCase().includes(searchWords[0]));
  return match ? match.dataUrl : null;
}

async function get111477MovieDownloads(mediaItem: MediaItem): Promise<DownloadFile[]> {
  const tmdbTitle = mediaItem?.title || mediaItem?.name;
  const releaseYear = mediaItem?.release_date?.slice(0, 4) || '';
  const searchName = (tmdbTitle || '').replace(/:/g, ' - ').replace(/['']/g, "'");
  
  const listingHtml = await fetchPage(`${BASE_URL}/movies/`);
  if (!listingHtml) return [];

  const rows = parseRows(listingHtml);
  const searchNormalized = searchName.toLowerCase();
  const searchWords = searchNormalized.split(' ').filter(w => w.length > 2);

  let targetRow = rows.find(r => {
    const normalized = r.dataName.toLowerCase();
    return normalized.includes(searchNormalized) && (!releaseYear || normalized.includes(releaseYear));
  });

  if (!targetRow) {
    targetRow = rows.find(r => {
      const normalized = r.dataName.toLowerCase();
      const matchCount = searchWords.filter(word => normalized.includes(word)).length;
      return matchCount >= Math.ceil(searchWords.length * 0.7) && (!releaseYear || normalized.includes(releaseYear));
    });
  }

  if (!targetRow) {
    targetRow = rows.find(r => r.dataName.toLowerCase().includes(searchWords[0]));
  }

  if (!targetRow) return [];

  let detailUrl = targetRow.dataUrl;
  if (detailUrl.startsWith('/')) detailUrl = `${BASE_URL}${detailUrl}`;
  else if (!detailUrl.startsWith('http')) detailUrl = `${BASE_URL}/${detailUrl}`;

  const detailHtml = await fetchPage(detailUrl);
  if (!detailHtml) return [];

  const fileRows = parseRows(detailHtml);
  const downloads: DownloadFile[] = fileRows
    .filter(r => r.dataName.match(/\.(mkv|mp4|avi|mov|webm)$/i))
    .map(r => {
      let fullUrl = r.dataUrl;
      if (fullUrl.startsWith('/')) fullUrl = `${BASE_URL}${fullUrl}`;
      else if (!fullUrl.startsWith('http')) fullUrl = `${BASE_URL}/${fullUrl}`;
      
      return {
        url: fullUrl,
        name: r.dataName,
        size: formatSize(r.size),
        quality: extractQuality(r.dataName)
      };
    });

  downloads.sort((a, b) => {
    const qualityOrder: Record<string, number> = { '4K': 0, '1080p': 1, '720p': 2, '480p': 3, 'Unknown': 4 };
    return (qualityOrder[a.quality] ?? 4) - (qualityOrder[b.quality] ?? 4);
  });

  return downloads;
}

async function get111477TVDownloads(mediaItem: MediaItem, season?: number, episode?: number): Promise<{ seasons: SeasonInfo[]; downloads: DownloadFile[] }> {
  const tmdbTitle = mediaItem?.name || mediaItem?.title;
  const searchName = (tmdbTitle || '').replace(/:/g, ' - ').replace(/['']/g, "'");
  
  const listingHtml = await fetchPage(`${BASE_URL}/tvs/`);
  if (!listingHtml) return { seasons: [], downloads: [] };

  const rows = parseRows(listingHtml);
  const showUrl = findShowFolder(rows, searchName);
  if (!showUrl) return { seasons: [], downloads: [] };

  let fullShowUrl = showUrl;
  if (fullShowUrl.startsWith('/')) fullShowUrl = `${BASE_URL}${fullShowUrl}`;
  else if (!fullShowUrl.startsWith('http')) fullShowUrl = `${BASE_URL}/${fullShowUrl}`;

  const showHtml = await fetchPage(fullShowUrl);
  if (!showHtml) return { seasons: [], downloads: [] };

  const seasonRows = parseRows(showHtml);
  const seasonFolders = seasonRows.filter(r => r.dataName.toLowerCase().includes('season'));
  
  const seasons: SeasonInfo[] = [];
  
  for (const sf of seasonFolders) {
    const seasonMatch = sf.dataName.match(/Season\s*(\d+)/i);
    if (!seasonMatch) continue;
    
    const seasonNum = parseInt(seasonMatch[1]);
    
    if (season !== undefined && seasonNum !== season) continue;
    
    let seasonUrl = sf.dataUrl;
    if (seasonUrl.startsWith('/')) seasonUrl = `${BASE_URL}${seasonUrl}`;
    else if (!seasonUrl.startsWith('http')) seasonUrl = `${BASE_URL}/${seasonUrl}`;
    
    const seasonHtml = await fetchPage(seasonUrl);
    if (!seasonHtml) continue;
    
    const episodeRows = parseRows(seasonHtml);
    const episodes: DownloadFile[] = episodeRows
      .filter(r => r.dataName.match(/\.(mkv|mp4|avi|mov|webm)$/i))
      .map(r => {
        let fullUrl = r.dataUrl;
        if (fullUrl.startsWith('/')) fullUrl = `${BASE_URL}${fullUrl}`;
        else if (!fullUrl.startsWith('http')) fullUrl = `${BASE_URL}/${fullUrl}`;
        
        const epNum = extractEpisodeNumber(r.dataName);
        
        return {
          url: fullUrl,
          name: r.dataName,
          size: formatSize(r.size),
          quality: extractQuality(r.dataName),
          episode: epNum || undefined
        };
      })
      .filter(ep => {
        if (episode !== undefined && ep.episode !== undefined) {
          return ep.episode === episode;
        }
        return true;
      });
    
    episodes.sort((a, b) => {
      if (a.episode !== undefined && b.episode !== undefined) {
        if (a.episode !== b.episode) return a.episode - b.episode;
      }
      const qualityOrder: Record<string, number> = { '4K': 0, '1080p': 1, '720p': 2, '480p': 3, 'Unknown': 4 };
      return (qualityOrder[a.quality] ?? 4) - (qualityOrder[b.quality] ?? 4);
    });
    
    seasons.push({ seasonNumber: seasonNum, episodes });
  }
  
  seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
  
  const allDownloads = seasons.flatMap(s => s.episodes);
  
  return { seasons, downloads: allDownloads };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get('id');
  const mediaType = searchParams.get('type') || 'movie';
  const seasonParam = searchParams.get('season');
  const episodeParam = searchParams.get('episode');

  if (!tmdbId) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
    const tmdbRes = await fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}`, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    if (!tmdbRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch media info' }, { status: 404 });
    }

    const mediaInfo = await tmdbRes.json();
    
    if (mediaType === 'tv') {
      const season = seasonParam ? parseInt(seasonParam) : undefined;
      const episode = episodeParam ? parseInt(episodeParam) : undefined;
      const { seasons, downloads } = await get111477TVDownloads(mediaInfo, season, episode);
      
      return NextResponse.json({
        media: {
          id: tmdbId,
          title: mediaInfo.name || mediaInfo.title,
          poster: mediaInfo.poster_path ? `https://image.tmdb.org/t/p/w500${mediaInfo.poster_path}` : null,
          backdrop: mediaInfo.backdrop_path ? `https://image.tmdb.org/t/p/original${mediaInfo.backdrop_path}` : null,
          year: mediaInfo.first_air_date?.slice(0, 4),
          overview: mediaInfo.overview,
          type: mediaType,
          numberOfSeasons: mediaInfo.number_of_seasons
        },
        seasons,
        downloads
      });
    } else {
      const downloads = await get111477MovieDownloads(mediaInfo);
      
      return NextResponse.json({
        media: {
          id: tmdbId,
          title: mediaInfo.title || mediaInfo.name,
          poster: mediaInfo.poster_path ? `https://image.tmdb.org/t/p/w500${mediaInfo.poster_path}` : null,
          backdrop: mediaInfo.backdrop_path ? `https://image.tmdb.org/t/p/original${mediaInfo.backdrop_path}` : null,
          year: mediaInfo.release_date?.slice(0, 4),
          overview: mediaInfo.overview,
          type: mediaType
        },
        downloads
      });
    }
  } catch (error: any) {
    console.error('Downloads API error:', error);
    return NextResponse.json({ error: 'Failed to fetch downloads' }, { status: 500 });
  }
}
