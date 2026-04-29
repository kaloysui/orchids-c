/**
 * source-cache.ts
 * Persistent cache for scraped video sources using Supabase.
 * TTL: 7 days
 *
 * Table required (run once in Supabase SQL editor):
 *
 *   create table if not exists public.source_cache (
 *     cache_key   text primary key,
 *     data        jsonb not null,
 *     expires_at  timestamptz not null,
 *     created_at  timestamptz not null default now()
 *   );
 *
 *   create index if not exists source_cache_expires_idx
 *     on public.source_cache (expires_at);
 */

import { createClient } from '@supabase/supabase-js';

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer service role key (server-side only) to bypass RLS; fall back to anon
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getCachedSources(cacheKey: string): Promise<any | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('source_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .single();

    if (error || !data) return null;

    // Check expiry
    if (new Date(data.expires_at) < new Date()) {
      // Expired — delete async (don't await, keep response fast)
      supabase.from('source_cache').delete().eq('cache_key', cacheKey);
      return null;
    }

    return data.data;
  } catch {
    return null;
  }
}

export async function setCachedSources(cacheKey: string, payload: any): Promise<void> {
  try {
    const supabase = getSupabase();
    if (!supabase) return;

    const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

    await supabase
      .from('source_cache')
      .upsert(
        { cache_key: cacheKey, data: payload, expires_at: expiresAt },
        { onConflict: 'cache_key' }
      );
  } catch {
    // Cache write failure is non-fatal
  }
}
