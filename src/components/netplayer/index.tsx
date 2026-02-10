"use client";

import React, { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCinemullSources } from './hooks/useCinemullSources';
import { useWyzieSubtitles } from './hooks/useWyzieSubtitles';
import { useTMDBMetadata } from './hooks/useTMDBMetadata';
import { VideoPlayer, PlayerServer, PlayerSubtitle } from '../video-player';

export interface NetPlayerProps {
  movieId?: string;
  tvId?: string;
  season?: string | number;
  episode?: string | number;
  title?: string;
  subtitle?: string;
  autoPlay?: boolean;
  muted?: boolean;
  onEnded?: () => void;
  onError?: () => void;
  sources?: any[];
  subtitles?: any[];
}

export default function NetPlayer({
  movieId,
  tvId,
  season,
  episode,
  title,
  subtitle,
  autoPlay = true,
  onEnded,
  onError,
  sources: initialSources = [],
  subtitles: initialSubtitles = [],
}: NetPlayerProps) {
  const router = useRouter();
  const { metadata, nextEpisode, loading: loadingMetadata } = useTMDBMetadata(
    movieId,
    tvId,
    season,
    episode
  );

    const displayTitle = title || metadata.title;
    const displaySubtitle = subtitle || metadata.subtitle;
    const backdropUrl = metadata.backdropUrl;

    const { sources: dynamicSources = [], loading: loadingSources, hasFetched } = useCinemullSources(
      movieId,
      tvId,
      season,
      episode
    );

    // Fallback: if sources finished loading but returned empty, notify parent
    React.useEffect(() => {
      if (hasFetched && !loadingSources && dynamicSources.length === 0 && initialSources.length === 0 && onError) {
        console.log('[NetPlayer] No sources found from native player, triggering fallback');
        onError();
      }
    }, [hasFetched, loadingSources, dynamicSources.length, initialSources.length, onError]);

    const { subtitles: dynamicSubtitles = [], loading: loadingSubtitles } = useWyzieSubtitles(
      movieId,
      tvId,
      season,
      episode
    );

    const mergedServers = useMemo(() => {
      const UNIQUE_NAMES = ["Nova", "Astra", "Nebula", "Luna", "Titan", "Polaris", "Atlas", "Vega", "Lyra", "Orion", "Sirius", "Altair", "Deneb", "Rigel", "Capella", "Castor", "Pollux", "Antares", "Spica", "Arcturus", "Aldebaran", "Fomalhaut", "Regulus", "Canopus", "Procyon", "Achernar"];
      const allSources = [...initialSources, ...dynamicSources];
        return allSources.map((s, i) => {
          const qualityMatch = s.label?.match(/\(([^)]+)\)$/);
          const quality = qualityMatch ? qualityMatch[0] : "";
          
            // Determine language label instead of flag
            const checkText = (s.originalLabel || s.label || "").toLowerCase();
            let flag = s.flag || "English"; // Default to English
            
            if (!s.flag || s.flag === "US") {
              if (checkText.includes("telugu")) {
                flag = "Telugu";
              } else if (checkText.includes("tamil")) {
                flag = "Tamil";
              } else if (checkText.includes("hindi") || checkText.includes("(in)")) {
                flag = "Hindi";
              } else if (checkText.includes("vietnamese") || checkText.includes("(vn)")) {
                flag = "Vietnamese";
              } else if (checkText.includes("japanese") || checkText.includes("(jp)")) {
                flag = "Japanese";
              } else if (checkText.includes("korean") || checkText.includes("(kr)")) {
                flag = "Korean";
              } else if (checkText.includes("chinese") || checkText.includes("(cn)")) {
                flag = "Chinese";
              } else if (checkText.includes("french") || checkText.includes("(fr)")) {
                flag = "French";
              } else if (checkText.includes("spanish") || checkText.includes("(es)")) {
                flag = "Spanish";
              } else {
                flag = "English";
              }
            } else if (s.flag === "IN") {
              if (checkText.includes("telugu")) flag = "Telugu";
              else if (checkText.includes("tamil")) flag = "Tamil";
              else flag = "Hindi";
            } else if (s.flag === "JP") flag = "Japanese";
            else if (s.flag === "KR") flag = "Korean";
            else if (s.flag === "VN") flag = "Vietnamese";
            else if (s.flag === "FR") flag = "French";
            else if (s.flag === "ES") flag = "Spanish";
            else if (s.flag === "CN") flag = "Chinese";
            else if (s.flag === "US") flag = "English";
          
          const isBCine = s.label === "bCine" || (s.label && s.label.startsWith("bCine "));
          const serverName = isBCine ? s.label : `${UNIQUE_NAMES[i % UNIQUE_NAMES.length]}${quality ? ` ${quality}` : ""}`;
          
          return {
            name: serverName,
            url: s.file,
            type: s.type as "hls" | "mp4",
            flag: flag
          };
        }) as PlayerServer[];
    }, [initialSources, dynamicSources]);

    const mergedSubtitles = useMemo(() => {
      const allSubtitles = [...initialSubtitles, ...dynamicSubtitles];
      return allSubtitles.map((s, i) => ({
        id: s.lang || s.label || `sub-${i}`,
        name: s.label || s.lang || `Subtitle ${i + 1}`,
        src: s.file,
        language: s.lang || s.language,
      })) as PlayerSubtitle[];
    }, [initialSubtitles, dynamicSubtitles]);

    const handleAutoNext = useCallback(() => {
      if (nextEpisode) {
        if (onEnded) {
          onEnded();
        } else {
          router.push(`/tv/${nextEpisode.id}/${nextEpisode.season}/${nextEpisode.episode}`);
        }
      }
    }, [nextEpisode, onEnded, router]);

    return (
      <div className="h-full w-full bg-black overflow-hidden">
            <VideoPlayer
              key={`${movieId}-${tvId}-${season}-${episode}`}
              servers={mergedServers}
            subtitles={mergedSubtitles}
            title={displayTitle}
            subtitle={displaySubtitle}
            poster={backdropUrl}
            autoPlay={autoPlay}
            themeColor="var(--primary)"
            isLoading={loadingSources || loadingMetadata}
            nextEpisode={nextEpisode}
            onAutoNext={handleAutoNext}
            onEnded={onEnded}
          />
    </div>
  );
}
