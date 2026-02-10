"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export interface Song {
  id: string;
  name: string;
  album: {
    id?: string;
    name: string;
    image?: { quality: string; link: string }[] | string;
  };
  image: { quality: string; link: string }[];
  primaryArtists: string;
  downloadUrl: { quality: string; link: string }[];
  duration: string;
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  year?: string;
  type?: string;
  playCount?: string;
  language?: string;
  explicitContent?: string;
  songCount?: string;
  url?: string;
  primaryArtists?: string;
  image: { quality: string; link: string }[];
  songs?: Song[];
}

export interface Artist {
  id: string;
  name: string;
  image: { quality: string; link: string }[];
  role?: string;
  type?: string;
  url?: string;
}

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  playSong: (song: Song) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  togglePlay: () => void;
  progress: number;
  duration: number;
  seek: (time: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  stopMusic: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;
  getArtistsString: (artists: any) => string;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

    const playNext = () => {
      if (queue.length > 0) {
        const nextSong = queue[0];
        setQueue(prev => prev.slice(1));
        
        // Update state BEFORE playing to ensure UI updates immediately
        setCurrentSong(nextSong);
        setProgress(0);
        setIsPlaying(true);
        
        const url = nextSong.downloadUrl.find(d => d.quality === "320kbps")?.link || 
                   nextSong.downloadUrl[nextSong.downloadUrl.length - 1].link;
        
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play().catch(err => console.error("Playback error:", err));
        }
      } else {
        setIsPlaying(false);
      }
    };

  const playPrevious = () => {
    if (audioRef.current) {
      // If we're more than 3 seconds in, just restart current song
      if (audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
        setProgress(0);
      } else {
        // In a real app, you might want a "history" stack for this
        // For now, let's just seek to start
        audioRef.current.currentTime = 0;
        setProgress(0);
      }
    }
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      // Use a small timeout to ensure state is ready and avoid race conditions
      setTimeout(() => {
        playNext();
      }, 100);
    };
    
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [queue]); // Re-bind when queue changes so playNext has latest queue

  const playSong = (song: Song) => {
    if (!audioRef.current) return;
    
    const url = song.downloadUrl.find(d => d.quality === "320kbps")?.link || 
               song.downloadUrl[song.downloadUrl.length - 1].link;
    
    if (currentSong?.id === song.id) {
      togglePlay();
      return;
    }

    setProgress(0);
    setCurrentSong(song);
    audioRef.current.src = url;
    audioRef.current.play().catch(err => console.error("Playback error:", err));
    setIsPlaying(true);
  };

  const pauseSong = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const resumeSong = () => {
    audioRef.current?.play();
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) pauseSong();
    else resumeSong();
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      const nextTime = Math.min(audioRef.current.currentTime + 10, audioRef.current.duration);
      audioRef.current.currentTime = nextTime;
      setProgress(nextTime);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      const nextTime = Math.max(audioRef.current.currentTime - 10, 0);
      audioRef.current.currentTime = nextTime;
      setProgress(nextTime);
    }
  };

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      setIsPlaying(false);
      setCurrentSong(null);
      setProgress(0);
    }
  };

  const addToQueue = (song: Song) => {
    setQueue(prev => [...prev, song]);
  };

  const removeFromQueue = (songId: string) => {
    setQueue(prev => prev.filter(s => s.id !== songId));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const getArtistsString = (artists: any) => {
    if (!artists) return "Various Artists";
    if (typeof artists === "string") return artists;
    if (Array.isArray(artists)) {
      return artists.map(a => typeof a === "string" ? a : a.name).join(", ");
    }
    if (typeof artists === "object" && artists.name) return artists.name;
    return "Various Artists";
  };

  return (
    <MusicContext.Provider value={{ 
      currentSong, 
      isPlaying, 
      queue,
      playSong, 
      pauseSong, 
      resumeSong, 
      togglePlay,
      progress,
      duration,
      seek,
      skipForward,
      skipBackward,
      stopMusic,
      addToQueue,
      removeFromQueue,
      clearQueue,
      playNext,
      playPrevious,
      getArtistsString
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
