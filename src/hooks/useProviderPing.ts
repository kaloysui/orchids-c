"use client";

import { useState, useEffect } from "react";

const PROVIDER_URLS: Record<string, string> = {
  beech: "https://scrennnifu.click",
  cedar: "https://player.videasy.net",
  buke: "https://vidsrc.cc",
};

export function useProviderPing() {
  const [pings, setPings] = useState<Record<string, number | "error"> | null>(null);

  useEffect(() => {
    async function measurePing(id: string, url: string) {
      const start = performance.now();
      try {
        await fetch(url, { mode: "no-cors", cache: "no-store" });
        const end = performance.now();
        return Math.round(end - start);
      } catch (error) {
        console.error(`Ping failed for ${id}:`, error);
        return "error" as const;
      }
    }

    async function updatePings() {
      const results: Record<string, number | "error"> = {};
      const promises = Object.entries(PROVIDER_URLS).map(async ([id, url]) => {
        results[id] = await measurePing(id, url);
      });
      await Promise.all(promises);
      setPings(results);
    }

    updatePings();
    const interval = setInterval(updatePings, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return pings;
}
