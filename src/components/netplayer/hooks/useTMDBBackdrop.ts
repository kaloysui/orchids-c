"use client";

import { useState, useEffect } from 'react';

const TMDB_API_KEY = '3e20e76d6d210b6cb128d17d233b64dc';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export function useTMDBBackdrop(movieId?: string, tvId?: string) {
  const [backdropUrl, setBackdropUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBackdrop() {
      if (!movieId && !tvId) {
        setBackdropUrl(null);
        return;
      }
      
      setLoading(true);
      try {
        const type = movieId ? 'movie' : 'tv';
        const id = movieId || tvId;
        const response = await fetch(
          `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`
        );
        const data = await response.json();
        
        if (data.backdrop_path) {
          setBackdropUrl(`https://image.tmdb.org/t/p/original${data.backdrop_path}`);
        } else {
          setBackdropUrl(null);
        }
      } catch (error) {
        console.error('Failed to fetch TMDB backdrop:', error);
        setBackdropUrl(null);
      } finally {
        setLoading(false);
      }
    }

    fetchBackdrop();
  }, [movieId, tvId]);

  return { backdropUrl, loading };
}

export default useTMDBBackdrop;
