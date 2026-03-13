import { EmbedSource, USER_AGENT, robustFetch } from './utils';

const CINEMAOS_API = 'https://cinemaos.tech/api/provider';
const ENCRYPTION_KEY = 'a1b2c3d4e4f6477658455678901477567890abcdef1234567890abcdef123456';
const PRIMARY_KEY = 'a7f3b9c2e8d4f1a6b5c9e2d7f4a8b3c6e1d9f7a4b2c8e5d3f9a6b4c1e7d2f8a5';
const SECONDARY_KEY = 'd3f8a5b2c9e6d1f7a4b8c5e2d9f3a6b1c7e4d8f2a9b5c3e7d4f1a8b6c2e9d5f3';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return bytesToHex(new Uint8Array(signature));
}

async function generateSecret(tmdbId: string, seasonId?: string, episodeId?: string): Promise<string> {
  const parts: string[] = [];
  if (tmdbId) parts.push(`tmdbId:${tmdbId}`);
  if (seasonId) parts.push(`seasonId:${seasonId}`);
  if (episodeId) parts.push(`episodeId:${episodeId}`);
  const content = parts.join('|');
  
  const first = await hmacSha256(PRIMARY_KEY, content);
  return hmacSha256(SECONDARY_KEY, first);
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number, keyLength: number): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    keyLength * 8
  );
  return new Uint8Array(derivedBits);
}

async function decrypt(data: { salt: string; cin: string; mao: string; encrypted: string }): Promise<any> {
  const saltBuf = hexToBytes(data.salt);
  const ivBuf = hexToBytes(data.cin);
  const authTagBuf = hexToBytes(data.mao);
  const encryptedBuf = hexToBytes(data.encrypted);
  
  const keyBytes = await pbkdf2(ENCRYPTION_KEY, saltBuf, 100000, 32);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const cipherWithTag = new Uint8Array(encryptedBuf.length + authTagBuf.length);
  cipherWithTag.set(encryptedBuf);
  cipherWithTag.set(authTagBuf, encryptedBuf.length);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuf },
    key,
    cipherWithTag
  );
  
  return JSON.parse(new TextDecoder().decode(decrypted));
}

export async function tryCinemaOS(path: string): Promise<{ sources: EmbedSource[], baseUrl: string } | null> {
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
    
    console.log('[Scraper] Trying cinemaos for:', path);
    
    const secret = isTV 
      ? await generateSecret(tmdbId, season, episode)
      : await generateSecret(tmdbId);
    
    let apiUrl = `${CINEMAOS_API}?tmdbId=${tmdbId}&type=${isTV ? 'tv' : 'movie'}&secret=${secret}`;
    if (isTV) {
      apiUrl += `&seasonId=${season}&episodeId=${episode}`;
    }
    
    const res = await robustFetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': `https://cinemaos.tech/player/${tmdbId}${isTV ? `/${season}/${episode}` : ''}`,
        'Origin': 'https://cinemaos.tech',
      }
    }, 1, 15000);
    
    if (!res.ok) {
      console.log('[Scraper] cinemaos API error:', res.status);
      return null;
    }
    
    const json = await res.json();
    
    if (json.error) {
      console.log('[Scraper] cinemaos error:', json.error);
      return null;
    }
    
    if (!json.data || !json.data.encrypted) {
      console.log('[Scraper] cinemaos no encrypted data');
      return null;
    }
    
    const decrypted = await decrypt(json.data);
    const sources: EmbedSource[] = [];
    
    if (decrypted.sources) {
      let id = 1;
      for (const [serverName, serverData] of Object.entries(decrypted.sources) as [string, any][]) {
        if (serverData.url) {
          sources.push({
            id: id++,
            name: serverName,
            quality: serverData.bitrate || 'HD',
            title: `${serverName} (${serverData.bitrate || 'HD'})`,
            url: serverData.url,
            type: serverData.type || 'hls',
            headers: {
              'Referer': 'https://cinemaos.tech/',
              'Origin': 'https://cinemaos.tech'
            }
          });
        } else if (serverData.qualities) {
          const qualities = serverData.qualities as Record<string, { url: string; type?: string }>;
          const bestQuality = ['1080', '720', '480', '360'].find(q => qualities[q]);
          if (bestQuality && qualities[bestQuality]) {
            sources.push({
              id: id++,
              name: serverName,
              quality: `${bestQuality}p`,
              title: `${serverName} (${bestQuality}p)`,
              url: qualities[bestQuality].url,
              type: qualities[bestQuality].type || 'mp4',
              headers: {
                'Referer': 'https://cinemaos.tech/',
                'Origin': 'https://cinemaos.tech'
              }
            });
          }
        }
      }
    }
    
    console.log(`[Scraper] cinemaos found ${sources.length} sources`);
    return sources.length > 0 ? { sources, baseUrl: 'https://cinemaos.tech' } : null;
  } catch (e) {
    console.error('[Scraper] cinemaos error:', e);
    return null;
  }
}
