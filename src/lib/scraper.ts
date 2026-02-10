import { tryVidzee } from './providers/vidzee';
import { tryVideasy } from './providers/videasy';
import { tryBCine } from './providers/bcine';
import { EmbedSource, robustFetch } from './providers/utils';
import { Track } from '@/components/netplayer/types/player';

export type { EmbedSource };

export function decodeObfuscatedUrl(encoded: string): string | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const reversed = decoded.split('').reverse().join('');
    if (reversed.startsWith('http://') || reversed.startsWith('https://')) {
      return reversed;
    }
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export function isObfuscatedUrl(str: string): boolean {
  if (!str || str.length < 20) return false;
  if (str.startsWith('http://') || str.startsWith('https://')) return false;
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(str);
}

export async function extractEmbedMaster(url: string) {
  const path = url.startsWith('http') ? new URL(url).pathname.slice(1) : url;
  
  const allSources: EmbedSource[] = [];
  const allTracks: Track[] = [];
  let primaryBaseUrl = '';

    const providers = [
      { name: 'VIDEASY', fn: () => tryVideasy(path), priority: 0 },
      { name: 'BCINE', fn: () => tryBCine(path), priority: 1 },
      { name: 'VIDZEE', fn: () => tryVidzee(path), priority: 2 },
    ];

    // Wait for all results and aggregate
    const aggregateResults = async () => {
      const results = await Promise.allSettled(providers.map(p => p.fn()));
      const allSources: EmbedSource[] = [];
      const allTracks: Track[] = [];
      let finalBaseUrl = '';

      // Sort by priority so we can pick a base URL if needed
      const successfulResults = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map((r, i) => ({ ...r.value, priority: providers[i].priority }));
      
      successfulResults.sort((a, b) => a.priority - b.priority);

      for (const res of successfulResults) {
        if (!finalBaseUrl) finalBaseUrl = res.baseUrl;
        if (res.sources) {
          allSources.push(...res.sources);
        }
        if (res.tracks) {
          allTracks.push(...res.tracks);
        }
      }

      if (allSources.length === 0) return null;

      return {
        sources: allSources.map((s, i) => ({ ...s, id: i + 1 })),
        baseUrl: finalBaseUrl,
        tracks: allTracks
      };
    };

    const result = await Promise.race([
      aggregateResults(),
      new Promise<null>((r) => setTimeout(() => r(null), 25000))
    ]);
    
    if (result && result.sources.length > 0) {
      return result;
    }
    
    return { sources: [], baseUrl: '', tracks: [] };
  }

export async function resolveFinalSource(baseUrl: string, encodedUrl: string, depth = 0): Promise<{ type: string; url: string; resolutions?: { type: string, url: string }[], source?: string }> {
  if (depth > 5) return { type: 'error', url: 'Too many redirects' };
  
  if (baseUrl === 'https://player.vidzee.wtf') {
    if (encodedUrl.startsWith('http') && encodedUrl.includes('.m3u8')) {
      console.log('[resolveFinalSource] Vidzee direct HLS:', encodedUrl);
      return { type: 'm3u8', url: encodedUrl, source: 'Vidzee' };
    }
    return { type: 'error', url: 'Vidzee source not resolved' };
  }
  
  if (isObfuscatedUrl(encodedUrl)) {
    const decodedUrl = decodeObfuscatedUrl(encodedUrl);
    if (decodedUrl) {
      console.log(`[resolveFinalSource] Decoded obfuscated URL: ${decodedUrl}`);
      if (decodedUrl.includes('.m3u8')) {
        return { type: 'm3u8', url: decodedUrl, source: 'decoded' };
      }
      if (decodedUrl.includes('.mp4')) {
        return { type: 'mp4', url: decodedUrl, source: 'decoded' };
      }
      return resolveSourceDirectly(decodedUrl);
    }
  }
  
  let playUrl = encodedUrl.startsWith('http') 
    ? encodedUrl 
    : (encodedUrl.startsWith('/') 
        ? `${baseUrl}${encodedUrl}` 
        : `${baseUrl}/play/${encodeURIComponent(encodedUrl)}`);
  
  try {
    const res = await robustFetch(playUrl, {
      headers: {
        'Referer': baseUrl + '/'
      },
    }, 1, 8000);
    
    const finalUrl = res.url;
    const content = await res.text();

    if (content.includes('#EXTM3U')) {
      return {
        type: 'm3u8',
        url: finalUrl,
        source: new URL(finalUrl).hostname
      };
    }

    const generic = await extractGenericEmbed(playUrl, baseUrl);
    if (generic.m3u8.length > 0) {
      return {
        type: 'm3u8',
        url: generic.m3u8[0],
        resolutions: generic.m3u8.map(u => ({ type: 'm3u8', url: u })),
        source: 'direct'
      };
    }
    if (generic.mp4.length > 0) {
      return {
        type: 'mp4',
        url: generic.mp4[0],
        resolutions: generic.mp4.map(u => ({ type: 'mp4', url: u })),
        source: 'direct'
      };
    }

    return { type: 'error', url: 'No stream found' };
  } catch (error) {
    console.error('Resolve error:', error);
    return { type: 'error', url: playUrl };
  }
}

async function extractGenericEmbed(url: string, referrer: string) {
  try {
    const res = await robustFetch(url, {
      headers: {
        'Referer': referrer
      }
    }, 1, 8000);
    const text = await res.text();
    
    const m3u8Regex = /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/g;
    const mp4Regex = /["'](https?:\/\/[^"']+\.mp4[^"']*)["']/g;
    
    const m3u8 = Array.from(text.matchAll(m3u8Regex)).map(m => m[1]);
    const mp4 = Array.from(text.matchAll(mp4Regex)).map(m => m[1]);
    
    return { m3u8, mp4 };
  } catch {
    return { m3u8: [], mp4: [] };
  }
}

export async function resolveSourceDirectly(url: string): Promise<{ type: string; url: string; resolutions?: { type: string, url: string }[], source?: string }> {
  try {
    const generic = await extractGenericEmbed(url, url);
    if (generic.m3u8.length > 0) {
      return {
        type: 'm3u8',
        url: generic.m3u8[0],
        resolutions: generic.m3u8.map(u => ({ type: 'm3u8', url: u })),
        source: new URL(url).hostname
      };
    }
    if (generic.mp4.length > 0) {
      return {
        type: 'mp4',
        url: generic.mp4[0],
        resolutions: generic.mp4.map(u => ({ type: 'mp4', url: u })),
        source: new URL(url).hostname
      };
    }
    
    return { type: 'error', url };
  } catch (error) {
    return { type: 'error', url };
  }
}

