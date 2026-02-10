
async function checkUrl(url: string) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Referer': 'https://scrennnifu.click/',
        'Origin': 'https://scrennnifu.click'
      }
    });
    console.log(`URL: ${url}`);
    console.log(`Status: ${response.status}`);
    return response.status === 200;
  } catch (e: any) {
    console.log(`URL: ${url}`);
    console.log(`Error: ${e.message}`);
    return false;
  }
}

async function test() {
  const tmdbId = '66732'; // Stranger Things TMDB
  const imdbId = 'tt4574334'; // Stranger Things IMDB

  console.log('--- Testing Stranger Things S1E1 ---');
  
  console.log('\nTesting with IMDB ID:');
  await checkUrl(`https://scrennnifu.click/serial/${imdbId}/1/1/playlist.m3u8`);

  console.log('\nTesting with TMDB ID:');
  await checkUrl(`https://scrennnifu.click/serial/${tmdbId}/1/1/playlist.m3u8`);

  console.log('\n--- Testing Interstellar ---');
  const interstellarTmdb = '157336';
  const interstellarImdb = 'tt0816692';

  console.log('\nTesting with IMDB ID:');
  await checkUrl(`https://scrennnifu.click/movie/${interstellarImdb}/playlist.m3u8`);

  console.log('\nTesting with TMDB ID:');
  await checkUrl(`https://scrennnifu.click/movie/${interstellarTmdb}/playlist.m3u8`);
}

test();
