"use client";

import * as React from 'react';
import { fetchCinemullSources, ServerInfo } from '../utils/cinemull';
import { Source } from '../types';

export function useCinemullSources(
  movieId?: string,
  tvId?: string,
  season?: string | number,
  episode?: string | number
) {
  const [sources, setSources] = React.useState<Source[]>([]);
  const [servers, setServers] = React.useState<ServerInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasFetched, setHasFetched] = React.useState(false);

  const stableMovieId = movieId;
  const stableTvId = tvId;
  const stableSeason = season;
  const stableEpisode = episode;

  React.useEffect(() => {
    if (!stableMovieId && !stableTvId) {
      setSources([]);
      setServers([]);
      setLoading(false);
      setHasFetched(true);
      return;
    }

    async function getSources() {
      setLoading(true);
      
      const type = stableMovieId ? 'movie' : 'tv';
      const id = (stableMovieId || stableTvId) as string;
      
      const UNIQUE_NAMES = ["Nova", "Astra", "Nebula", "Luna", "Titan", "Polaris", "Atlas", "Vega", "Lyra", "Orion", "Sirius", "Altair", "Deneb", "Rigel", "Capella", "Castor", "Pollux", "Antares", "Spica", "Arcturus", "Aldebaran", "Fomalhaut", "Regulus", "Canopus", "Procyon", "Achernar"];

      try {
        const result = await fetchCinemullSources(type, id, stableSeason, stableEpisode);
        
            const formattedSources: Source[] = result.servers.map((server, index) => {
              let label = server.name === 'bCine' ? 'bCine' : UNIQUE_NAMES[index % UNIQUE_NAMES.length];
              
              if (server.quality && server.quality !== 'Auto') {
                label += ` (${server.quality})`;
              }

                return {
                  file: server.url,
                  label: label,
                  originalLabel: server.title || server.name,
                  type: server.type === 'mp4' ? 'mp4' : 'hls',
                  headers: server.headers,
                  useProxy: server.useProxy,
                  flag: server.flag
                };
            });

        if (formattedSources.length === 0 && result.urls.length > 0) {
          result.urls.forEach((url, index) => {
            let label = UNIQUE_NAMES[index % UNIQUE_NAMES.length];
            if (url.includes('1080')) label += ' (1080p)';
            else if (url.includes('720')) label += ' (720p)';
            else if (url.includes('480')) label += ' (480p)';
            else if (url.includes('360')) label += ' (360p)';

            formattedSources.push({
              file: url,
              label: label,
              type: 'hls'
            });
          });
        }

        setSources(formattedSources);
        setServers(result.servers);
      } catch (error) {
        console.error('Error fetching sources:', error);
        setSources([]);
        setServers([]);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    }

    getSources();
  }, [stableMovieId, stableTvId, stableSeason, stableEpisode]);

  return { sources, servers, loading, hasFetched };
}
