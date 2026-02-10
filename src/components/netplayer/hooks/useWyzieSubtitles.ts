"use client";

import * as React from 'react';
import { Subtitle } from '../types';

export function useWyzieSubtitles(
  movieId?: string,
  tvId?: string,
  season?: string | number,
  episode?: string | number
) {
  const [subtitles, setSubtitles] = React.useState<Subtitle[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    async function getSubtitles() {
      if (!movieId && !tvId) {
        setSubtitles([]);
        return;
      }

      setLoading(true);
      const id = (movieId || tvId) as string;
      
      const searchParams = new URLSearchParams({ id });
      
      if (tvId) {
        searchParams.set('season', String(season || '1'));
        searchParams.set('episode', String(episode || '1'));
      }

      try {
        const response = await fetch(`/api/subtitles?${searchParams.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch subtitles: ${response.statusText}`);
        }

        const data = await response.json();
        setSubtitles(data || []);
      } catch (error) {
        console.error('Error fetching subtitles:', error);
        setSubtitles([]);
      } finally {
        setLoading(false);
      }
    }

    getSubtitles();
  }, [movieId, tvId, season, episode]);

  return { subtitles, loading };
}
