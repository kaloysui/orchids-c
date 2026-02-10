import { tryVideasy } from '../src/lib/providers/videasy';

async function test() {
  console.log('Testing Videasy for movie/550...');
  const result = await tryVideasy('movie/550');
  
  if (!result || !result.sources) {
    console.log('No sources found for Videasy');
    return;
  }

  console.log(`Found ${result.sources.length} sources`);
  
  for (const source of result.sources) {
    console.log(`\nTesting Source: ${source.name}`);
    console.log(`URL: ${source.url}`);
    
    try {
      const res = await fetch(source.url, {
        method: 'HEAD',
        headers: source.headers || {}
      });
      
      console.log(`Status: ${res.status} ${res.statusText}`);
      
      if (res.status === 403) {
        console.log('--- 403 Forbidden details ---');
        const getRes = await fetch(source.url, {
          method: 'GET',
          headers: source.headers || {}
        });
        console.log(`GET Status: ${getRes.status}`);
        // console.log(`Response snippet: ${(await getRes.text()).slice(0, 100)}`);
      }
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }
}

test().catch(console.error);
