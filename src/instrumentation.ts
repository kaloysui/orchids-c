export async function register() {
  // Bypass TLS certificate validation for TMDB API calls
  // Required because the VPS network/proxy intercepts HTTPS and presents
  // the bcine.app certificate instead of the actual API certificate
  if (typeof process !== 'undefined') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}
