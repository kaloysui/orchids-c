
const TMDB_ID = '157336'; // Interstellar
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function testDirect() {
  console.log('Testing VidLink Direct...');

  try {
    // 1. Get encrypted ID
    const encRes = await fetch(`https://enc-dec.app/api/enc-vidlink?text=${TMDB_ID}`);
    const encData = await encRes.json();
    const encryptedId = encData.result;
    console.log('Encrypted ID:', encryptedId);

    if (!encryptedId) {
      console.error('Failed to get encrypted ID');
      return;
    }

    // 2. Get playlist URL
    const apiPath = `https://vidlink.pro/api/b/movie/${encryptedId}`;
    const res = await fetch(apiPath, {
      headers: { 
        'User-Agent': USER_AGENT, 
        'Referer': 'https://vidlink.pro/' 
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch VidLink API:', res.status);
      return;
    }

    const data = await res.json();
    const playlistUrl = data?.stream?.playlist;
    console.log('Playlist URL:', playlistUrl);

    if (!playlistUrl) {
      console.error('No playlist URL found');
      return;
    }

    // 3. Test Fetching Playlist
    console.log('\n--- Testing Fetching Playlist ---');
    
    console.log('Test 1: No headers');
    const t1 = await fetch(playlistUrl).catch(e => ({ ok: false, status: e.message }));
    console.log('Status:', t1.status, t1.ok ? '(SUCCESS)' : '(FAILED)');

    console.log('\nTest 2: Only User-Agent');
    const t2 = await fetch(playlistUrl, { headers: { 'User-Agent': USER_AGENT } }).catch(e => ({ ok: false, status: e.message }));
    console.log('Status:', t2.status, t2.ok ? '(SUCCESS)' : '(FAILED)');

    console.log('\nTest 3: Origin + Referer (Simulating Proxy/Browser with headers)');
    const t3 = await fetch(playlistUrl, { 
      headers: { 
        'User-Agent': USER_AGENT,
        'Origin': 'https://vidlink.pro',
        'Referer': 'https://vidlink.pro/'
      } 
    }).catch(e => ({ ok: false, status: e.message }));
    
    if (t3 instanceof Response) {
      console.log('Status:', t3.status);
      console.log('CORS Headers:');
      console.log('  access-control-allow-origin:', t3.headers.get('access-control-allow-origin'));
      console.log('  access-control-allow-methods:', t3.headers.get('access-control-allow-methods'));
    }

    console.log('\nTest 4: Random Origin (Simulating browser on our domain)');
    const t4 = await fetch(playlistUrl, { 
      headers: { 
        'User-Agent': USER_AGENT,
        'Origin': 'https://your-app-domain.com'
      } 
    }).catch(e => ({ ok: false, status: e.message }));
    console.log('Status:', (t4 as any).status, (t4 as any).ok ? '(SUCCESS)' : '(FAILED)');

  } catch (error) {
    console.error('Test error:', error);
  }
}

testDirect();
