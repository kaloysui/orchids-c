import { tryScrennnifu } from './src/lib/providers/scrennnifu';

async function test() {
  console.log('Testing Scrennnifu with Stranger Things (TMDB ID: 66732, S1 E1)');
  const tvResult = await tryScrennnifu('tv/66732/1/1');
  console.log('TV Result:', JSON.stringify(tvResult, null, 2));
  
  if (tvResult && tvResult.sources.length > 0) {
    const url = tvResult.sources[0].url;
    console.log('\nChecking if URL is accessible:', url);
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        headers: {
          'Referer': 'https://scrennnifu.click/',
          'Origin': 'https://scrennnifu.click'
        }
      });
      console.log('Response Status:', response.status);
      console.log('Is OK:', response.ok);
    } catch (e) {
      console.log('Fetch error (expected if direct access blocked):', e.message);
    }
  }
}

test().catch(console.error);
