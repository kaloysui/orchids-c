import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.PROXY_SECRET || 'bidsrc_secret_key_2024_secure_v2';

/**
 * Simple obfuscation to hide the URL from casual inspection.
 * Base64 + Reverse + Custom Prefix
 */
export function obfuscateUrl(url: string): string {
  if (!url) return '';
  const reversed = url.split('').reverse().join('');
  const encoded = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(reversed));
  return `bs_${encoded}`;
}

/**
 * Decodes the obfuscated URL.
 */
export function deobfuscateUrl(obfuscated: string): string | null {
  if (!obfuscated || !obfuscated.startsWith('bs_')) return null;
  try {
    const data = obfuscated.slice(3);
    const decodedWA = CryptoJS.enc.Base64.parse(data);
    const decoded = CryptoJS.enc.Utf8.stringify(decodedWA);
    return decoded.split('').reverse().join('');
  } catch {
    return null;
  }
}

/**
 * Generates a short HMAC signature for a string.
 */
export function generateSignature(data: string): string {
  return CryptoJS.HmacSHA256(data, SECRET_KEY)
    .toString(CryptoJS.enc.Hex)
    .slice(0, 12);
}

/**
 * Verifies if the signature matches the data.
 */
export function verifySignature(data: string, signature: string): boolean {
  if (!data || !signature) return false;
  const expected = generateSignature(data);
  return expected === signature;
}

/**
 * Checks if the request is coming from an allowed origin or has a valid referer.
 */
export function isAllowedRequest(req: Request): boolean {
  const referer = req.headers.get('referer');
  const origin = req.headers.get('origin');
  
  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') return true;

    const allowedDomains = ['bcine.app', 'localhost'];
  
  const check = (urlStr: string | null) => {
    if (!urlStr) return false;
    try {
      const url = new URL(urlStr);
      return allowedDomains.some(domain => url.hostname.endsWith(domain));
    } catch {
      return false;
    }
  };

  return check(referer) || check(origin);
}
