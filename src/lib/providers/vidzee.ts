import { EmbedSource, USER_AGENT, robustFetch } from './utils';
import CryptoJS from 'crypto-js';

async function decryptVidzeeApiKey(encryptedKey: string): Promise<string> {
  try {
    const ed = 'b3f2a9d4c6e1f8a7b';
    
    // Use SubtleCrypto for AES-GCM (Edge & Node compatible)
    const t = Uint8Array.from(atob(encryptedKey.replace(/\s+/g, '')), c => c.charCodeAt(0));
    if (t.length <= 28) return '';
    
    const iv = t.slice(0, 12);
    const authTag = t.slice(12, 28);
    const ciphertext = t.slice(28);
    
    // Combine ciphertext and authTag for Web Crypto API
    const combined = new Uint8Array(ciphertext.length + authTag.length);
    combined.set(ciphertext);
    combined.set(authTag, ciphertext.length);
    
    const encoder = new TextEncoder();
    const edUint8 = encoder.encode(ed);
    const keyHash = await crypto.subtle.digest('SHA-256', edUint8);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyHash,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      combined
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error('[decryptVidzeeApiKey] Error:', e);
    return '';
  }
}

async function decryptVidzeeUrl(encryptedData: string, key: string): Promise<string> {
  try {
    const decoded = atob(encryptedData);
    const [ivB64, cipherB64] = decoded.split(':');
    if (!ivB64 || !cipherB64) return '';
    
    const iv = CryptoJS.enc.Base64.parse(ivB64);
    const paddedKey = key.padEnd(32, '\0');
    const keyWA = CryptoJS.enc.Utf8.parse(paddedKey);
    
    const decrypted = CryptoJS.AES.decrypt(cipherB64, keyWA, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8) || '';
  } catch (e) {
    console.error('[decryptVidzeeUrl] Error:', e);
    return '';
  }
}

export async function tryVidzee(path: string): Promise<{ sources: EmbedSource[], baseUrl: string } | null> {
  try {
    const isTV = path.startsWith('tv/');
        const VIDZEE_SERVERS = [
          { sr: '1', name: 'WILLOW', lang: 'English' },
          { sr: '2', name: 'BAMBOO', lang: 'English' },
          { sr: '3', name: 'CYPRESS', lang: 'English' },
          { sr: '4', name: 'REDWOOD', lang: 'English' },
          { sr: '5', name: 'SEQUOIA', lang: 'English' },
          { sr: '6', name: 'MANGROVE', lang: 'Vietnamese' },
          { sr: '7', name: 'BONSAI', lang: 'Japanese' },
          { sr: '8', name: 'BANYAN', lang: 'Telugu' },
          { sr: '9', name: 'TEAK', lang: 'Tamil' },
          { sr: '10', name: 'DEODAR', lang: 'Hindi' },
        ];
    
    let baseApiUrl: string;
    let id: string;
    
    if (isTV) {
      const parts = path.replace('tv/', '').split('/');
      id = parts[0];
      const season = parts[1] || '1';
      const episode = parts[2] || '1';
      baseApiUrl = `https://player.vidzee.wtf/api/server?id=${id}&ss=${season}&ep=${episode}`;
    } else {
      id = path.replace('movie/', '');
      baseApiUrl = `https://player.vidzee.wtf/api/server?id=${id}`;
    }
    
    console.log('[Scraper] Trying vidzee for id:', id);
    
      const keyRes = await robustFetch('https://core.vidzee.wtf/api-key', {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': 'https://player.vidzee.wtf/',
        }
      }, 1, 15000);
    
    if (!keyRes.ok) return null;
    const encryptedApiKey = await keyRes.text();
    const apiKey = await decryptVidzeeApiKey(encryptedApiKey);
    
    if (!apiKey) {
      console.log('[Scraper] vidzee: failed to decrypt API key');
      return null;
    }
    
    const sources: EmbedSource[] = [];
    
    const serverFetches = VIDZEE_SERVERS.map(async (server) => {
      try {
        const apiUrl = `${baseApiUrl}&sr=${server.sr}`;
          const res = await robustFetch(apiUrl, {
            headers: {
              'User-Agent': USER_AGENT,
              'Referer': 'https://player.vidzee.wtf/',
            }
          }, 1, 15000);
        
        if (!res.ok) return null;
        const data = await res.json();
        
        if (data.url && Array.isArray(data.url)) {
          for (const item of data.url) {
            if (item.link && item.type === 'hls') {
                const decryptedUrl = await decryptVidzeeUrl(item.link, apiKey);
                  if (decryptedUrl && decryptedUrl.startsWith('http')) {
                    return {
                    id: 0,
                    name: server.name,
                    quality: 'Auto',
                      title: `${server.name} (${server.lang})`,
                      lang: server.lang,
                      url: decryptedUrl,
                      type: 'vidzee'
                  };
                }
            }
          }
        }
        return null;
      } catch {
        return null;
      }
    });
    
    const results = await Promise.allSettled(serverFetches);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const src = result.value as EmbedSource;
        const exists = sources.some(s => s.name === src.name);
        if (!exists) {
          sources.push({ ...src, id: sources.length + 1 });
        }
      }
    }
    
    console.log(`[Scraper] vidzee found ${sources.length} sources`);
    return sources.length > 0 ? { sources, baseUrl: 'https://player.vidzee.wtf' } : null;
  } catch (e) {
    console.error('[Scraper] vidzee error:', e);
    return null;
  }
}
