"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

export interface WatchlistItem {
  id: number | string;
  media_type: "movie" | "tv" | "music";
  title?: string;
  name?: string;
  backdrop_path: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  updatedAt: number;
}

const STORAGE_KEY = "bcine-watchlist";

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, supabase } = useAuth();

  // Load items from Supabase
  useEffect(() => {
    const loadWatchlist = async () => {
      setLoading(true);
      if (user) {
        const { data, error } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error loading watchlist from Supabase:", error);
          setLoading(false);
          return;
        }

        const formattedItems: WatchlistItem[] = data.map((item: any) => ({
          id: item.media_id,
          media_type: item.media_type,
          title: item.title,
          name: item.name,
          backdrop_path: item.backdrop_path,
          vote_average: item.vote_average,
          release_date: item.release_date,
          first_air_date: item.first_air_date,
          updatedAt: new Date(item.updated_at).getTime(),
        }));
        setItems(formattedItems);
      } else {
        // If logged out, we clear the items to ensure "walay watch list ba ma save"
        setItems([]);
      }
      setLoading(false);
    };

    loadWatchlist();
  }, [user, supabase]);

  const addToWatchlist = useCallback(async (item: Omit<WatchlistItem, "updatedAt">) => {
    if (!user) {
      return;
    }

    const updatedAt = Date.now();
    const newItem = { ...item, updatedAt };

    const { error } = await supabase.from("watchlist").upsert({
      user_id: user.id,
      media_id: item.id,
      media_type: item.media_type,
      title: item.title,
      name: item.name,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average,
      release_date: item.release_date,
      first_air_date: item.first_air_date,
      updated_at: new Date(updatedAt).toISOString(),
    });

    if (error) {
      console.error("Error adding to watchlist in Supabase:", error);
      return;
    }

    setItems((prev) => {
      const filtered = prev.filter((i) => !(i.id === item.id && i.media_type === item.media_type));
      return [newItem, ...filtered];
    });
  }, [user, supabase]);

  const removeFromWatchlist = useCallback(async (id: number | string, type: "movie" | "tv" | "music") => {
    if (!user) return;

    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("media_id", id)
      .eq("media_type", type);

    if (error) {
      console.error("Error removing from watchlist in Supabase:", error);
      return;
    }

    setItems((prev) => prev.filter((i) => !(i.id === id && i.media_type === type)));
  }, [user, supabase]);

  const isInWatchlist = useCallback((id: number | string, type: "movie" | "tv" | "music") => {
    return items.some((i) => i.id === id && i.media_type === type);
  }, [items]);

  return { items, addToWatchlist, removeFromWatchlist, isInWatchlist, loading };
}
