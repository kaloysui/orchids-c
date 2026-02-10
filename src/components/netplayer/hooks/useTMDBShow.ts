"use client";

import { useState, useEffect } from 'react';

const TMDB_API_KEY = '3e20e76d6d210b6cb128d17d233b64dc';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  episode_number: number;
  still_path: string | null;
  overview: string;
}

export interface TMDBShowDetails {
  id: number;
  name: string;
  seasons: TMDBSeason[];
  backdrop_path: string | null;
  images?: {
    logos: {
      file_path: string;
      aspect_ratio: number;
    }[];
  };
}

export function useTMDBShow(tvId?: string) {
  const [showDetails, setShowDetails] = useState<TMDBShowDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchShow() {
      if (!tvId) {
        setShowDetails(null);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch(
          `${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&append_to_response=images&include_image_language=en,null`
        );
        const data = await response.json();
        setShowDetails(data);
      } catch (error) {
        console.error('Failed to fetch TMDB show details:', error);
        setShowDetails(null);
      } finally {
        setLoading(false);
      }
    }

    fetchShow();
  }, [tvId]);

  return { showDetails, loading };
}

export function useTMDBSeason(tvId?: string, seasonNumber?: number) {
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSeason() {
      if (!tvId || seasonNumber === undefined) {
        setEpisodes([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch(
          `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`
        );
        const data = await response.json();
        setEpisodes(data.episodes || []);
      } catch (error) {
        console.error('Failed to fetch TMDB season details:', error);
        setEpisodes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSeason();
  }, [tvId, seasonNumber]);

  return { episodes, loading };
}
