export interface ServerInfo {
  name: string;
  title?: string;
  quality: string;
  type: string;
  url: string;
  headers?: Record<string, string>;
  useProxy?: boolean;
  flag?: string;
}

export interface CinemullResponse {
  total: number;
  sources: string[];
  servers: ServerInfo[];
}

/**
 * Client-side de-obfuscation matching the backend logic.
 */
function deobfuscate(str: string): string {
  if (!str) return str;
  if (str.startsWith('/api/proxy')) return str;
  if (!str.startsWith('bs_')) return str;
  try {
    const data = str.slice(3);
    const decoded = atob(data);
    return decoded.split('').reverse().join('');
  } catch (e) {
    console.error('De-obfuscation error:', e);
    return str;
  }
}

const INTERNAL_KEY = 'bcine_internal_2024_x7k9';

export async function fetchCinemullSources(
  type: 'movie' | 'tv',
  id: string,
  season?: string | number,
  episode?: string | number
): Promise<{ urls: string[]; servers: ServerInfo[] }> {
    try {
      let url: string;
      if (type === 'movie') {
        url = `/api/movie/${id}`;
      } else {
        url = `/api/tv/${id}/${season || 1}/${episode || 1}`;
      }

      const response = await fetch(url, {
        headers: { 'x-bcine-key': INTERNAL_KEY }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch sources from API: ${response.statusText}`);
      }

    const data: CinemullResponse = await response.json();
    
    const urls = (data.sources || []).map(src => deobfuscate(src));

    const servers = (data.servers || []).map(server => ({
      ...server,
      url: deobfuscate(server.url)
    }));

    return { urls, servers };
  } catch (error) {
    console.error('Error fetching Cinemull sources:', error);
    return { urls: [], servers: [] };
  }
}
