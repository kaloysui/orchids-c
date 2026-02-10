"use client";

import { useState, useEffect } from 'react';

const TMDB_API_KEY = '3e20e76d6d210b6cb128d17d233b64dc';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export function useTMDBMetadata(
  movieId?: string,
  tvId?: string,
  season?: string | number,
  episode?: string | number
) {
  const [metadata, setMetadata] = useState<{ title?: string; subtitle?: string; backdropUrl?: string }>({});
  const [nextEpisode, setNextEpisode] = useState<{ title?: string; id?: string; season?: number; episode?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchMetadata() {
      if (!movieId && !tvId) {
        setMetadata({});
        setNextEpisode(null);
        return;
      }

      setLoading(true);
      try {
        if (movieId) {
          const res = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
          const data = await res.json();
          setMetadata({
            title: data.title || "Unknown Movie",
            subtitle: "",
            backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : undefined
          });
          setNextEpisode(null);
        } else if (tvId && season !== undefined && episode !== undefined) {
          const s = typeof season === 'string' ? parseInt(season) : season;
          const e = typeof episode === 'string' ? parseInt(episode) : episode;

          const tvRes = await fetch(`${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}`);
          const tvData = await tvRes.json();
          
          const epRes = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${s}/episode/${e}?api_key=${TMDB_API_KEY}`);
          const epData = await epRes.json();
          
          setMetadata({
            title: epData.name || `Episode ${e}`,
            subtitle: `S${s} E${e} ${tvData.name || ""}`,
            backdropUrl: tvData.backdrop_path ? `https://image.tmdb.org/t/p/original${tvData.backdrop_path}` : undefined
          });

          // Fetch next episode info
          try {
            const nextEpRes = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${s}/episode/${e + 1}?api_key=${TMDB_API_KEY}`);
            if (nextEpRes.ok) {
              const nextEpData = await nextEpRes.json();
              setNextEpisode({
                title: nextEpData.name || `Episode ${e + 1}`,
                id: tvId,
                season: s,
                episode: e + 1
              });
            } else {
              // Try next season episode 1
              const nextSeasonRes = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${s + 1}/episode/1?api_key=${TMDB_API_KEY}`);
              if (nextSeasonRes.ok) {
                const nextSeasonData = await nextSeasonRes.json();
                setNextEpisode({
                  title: nextSeasonData.name || "Episode 1",
                  id: tvId,
                  season: s + 1,
                  episode: 1
                });
              } else {
                setNextEpisode(null);
              }
            }
          } catch (e) {
            setNextEpisode(null);
          }
        }
      } catch (error) {
        console.error("TMDB Metadata Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [movieId, tvId, season, episode]);

  return { metadata, nextEpisode, loading };
}
