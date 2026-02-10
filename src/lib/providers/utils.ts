import { obfuscateUrl, generateSignature } from '../protection';

// Shared utilities for scrapers
export interface EmbedSource {
  id: string | number;
  name: string;
  quality: string;
  title: string;
  url: string;
  type: string;
  lang?: string;
  subtitles?: any;
  headers?: any;
  useProxy?: boolean;
  flag?: string;
}

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export const randomDelay = (min: number, max: number) => new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));

export async function fastFetch(url: string, options: RequestInit = {}, timeout = 8000): Promise<Response> {
  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function robustFetch(url: string, options: RequestInit = {}, _retries = 1, timeout = 5000): Promise<Response> {
  return fastFetch(url, options, timeout);
}

export function unpack(code: string): string {
  if (!code.includes('eval(function(p,a,c,k,e,d)')) return code;

  try {
    const match = code.match(/}\('(.+)',(\d+),(\d+),'([^']+)'\.split\('\|'\)/);
    if (!match) return code;

    let [_, p, a_str, c_str, k_str] = match;
    let a = parseInt(a_str);
    let c = parseInt(c_str);
    let k = k_str.split('|');
    
    const e = (c: number): string => {
      return (c < a ? '' : e(Math.floor(c / a))) + 
             ((c % a) > 35 ? String.fromCharCode((c % a) + 29) : (c % a).toString(36));
    };

    const d: Record<string, string> = {};
    while (c--) {
      if (k[c]) {
        d[e(c)] = k[c];
      }
    }

    return p.replace(/\b\w+\b/g, (w) => d[w] || w);
  } catch (err) {
    return code;
  }
}

export function wrapWithProxy(url: string): string {
  if (!url || url.startsWith('/api/proxy')) return url;
  const obfuscated = obfuscateUrl(url);
  const sig = generateSignature(obfuscated);
  return `/api/proxy?d=${encodeURIComponent(obfuscated)}&s=${sig}`;
}
