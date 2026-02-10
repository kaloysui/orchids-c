export interface Sport {
  id: string;
  name: string;
}

export interface MatchSource {
  id: string;
  source: string;
  name?: string;
}

export interface Match {
  id: string;
  title: string;
  date: number;
  poster: string;
  sport: string;
  teams: {
    home: {
      name: string;
      badge: string;
    };
    away: {
      name: string;
      badge: string;
    };
  };
  sources: MatchSource[];
}

export interface Stream {
  id: string;
  streamNo: number;
  name: string;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
}

const BASE_URL = 'https://streamed.pk/api';
const IMG_BASE_URL = 'https://streamed.pk/api/images';

export function getBadgeUrl(badgeId: string): string {
  if (!badgeId) return '';
  if (badgeId.startsWith('http')) return badgeId;
  // If it already starts with /api/images/badge, just prepend the base
  if (badgeId.startsWith('/api/images/badge/')) {
    return `https://streamed.pk${badgeId}`;
  }
  return `${IMG_BASE_URL}/badge/${badgeId}.webp`;
}

export function getPosterUrl(match: Match): string {
  if (match.poster) {
    if (match.poster.startsWith('http')) return match.poster;
    // If it already starts with /api/images/proxy, just prepend the base
    if (match.poster.startsWith('/api/images/proxy/')) {
      return `https://streamed.pk${match.poster}`;
    }
    return `${IMG_BASE_URL}/proxy/${match.poster}.webp`;
  }
  
  // Fallback to team-based poster if badges are available
  if (match.teams?.home?.badge && match.teams?.away?.badge) {
    // If badges are IDs, use the poster endpoint
    const homeBadge = match.teams.home.badge.includes('/') ? match.teams.home.badge.split('/').pop()?.replace('.webp', '') : match.teams.home.badge;
    const awayBadge = match.teams.away.badge.includes('/') ? match.teams.away.badge.split('/').pop()?.replace('.webp', '') : match.teams.away.badge;
    
    return `${IMG_BASE_URL}/poster/${homeBadge}/${awayBadge}.webp`;
  }

  return '';
}

export async function getSports(): Promise<Sport[]> {
  try {
    const response = await fetch(`${BASE_URL}/sports`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch sports');
    return await response.json();
  } catch (error) {
    console.error('Error fetching sports:', error);
    return [];
  }
}

export async function getMatches(sportId: string): Promise<Match[]> {
  try {
    const endpoint = sportId === 'all' ? 'matches/all' : `matches/${sportId}`;
    const response = await fetch(`${BASE_URL}/${endpoint}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to fetch matches for ${sportId}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching matches for ${sportId}:`, error);
    return [];
  }
}

export async function getStream(source: string, id: string): Promise<Stream[]> {
  try {
    // source should be the 'source' identifier (e.g., 'alpha', 'bravo')
    const response = await fetch(`${BASE_URL}/stream/${source}/${id}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch stream');
    return await response.json();
  } catch (error) {
    console.error('Error fetching stream:', error);
    return [];
  }
}
