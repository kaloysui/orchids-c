"use client";

import { useState, useEffect, useCallback } from "react";

export interface ContinueWatchingItem {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  backdrop_path: string;
  poster_path?: string;
  logoPath?: string | null;
  season?: number;
  episode?: number;
  progress: number; // 0 to 100
  currentTime?: number;
  duration?: number;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  updatedAt: number;
}

const STORAGE_KEY = "bcine-continue-watching";

export function useContinueWatching() {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
      } catch (e) {
        console.error("Failed to parse continue watching items", e);
      }
    }
  }, []);

  const saveItem = useCallback((item: Omit<ContinueWatchingItem, "updatedAt">) => {
    setItems((prev) => {
      const newItem = { ...item, updatedAt: Date.now() };
      const filtered = prev.filter((i) => !(i.id === item.id && i.media_type === item.media_type));
      const newItems = [newItem, ...filtered].slice(0, 20); // Keep top 20
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const removeItem = useCallback((id: number, type: "movie" | "tv") => {
    setItems((prev) => {
      const newItems = prev.filter((i) => !(i.id === id && i.media_type === type));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  return { items, saveItem, removeItem };
}
