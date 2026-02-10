"use client";

import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/hooks/useAuth";
import { getImageUrl } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, HeartOff, Lock } from "lucide-react";
import { SnakeLoader } from "@/components/ui/snake-loader";
import Link from "next/link";

export default function WatchlistPage() {
  const { items, removeFromWatchlist, loading: watchlistLoading } = useWatchlist();
  const { user, loading: authLoading } = useAuth();

  if (authLoading || (user && watchlistLoading)) {
    return (
      <main className="min-h-screen bg-background pt-32 pb-20 px-6 md:px-16 lg:px-24 flex items-center justify-center">
        <SnakeLoader size="lg" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background pt-32 pb-20 px-6 md:px-16 lg:px-24 flex flex-col items-center justify-center text-center">
        <div className="bg-primary/10 p-8 rounded-full mb-6 ring-1 ring-primary/20 animate-pulse">
          <Lock className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-white uppercase tracking-[0.2em] mb-4">
          Login Required
        </h1>
        <p className="text-zinc-400 max-w-md mb-8">
          Please log in to your account to view and manage your personalized watchlist across all your devices.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/"
            className="bg-zinc-900 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors border border-white/5"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const watchItems = items.filter(item => item.media_type === "movie" || item.media_type === "tv");
  const musicItems = items.filter(item => item.media_type === "music");

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background pt-32 pb-20 px-6 md:px-16 lg:px-24 flex flex-col items-center justify-center text-center">
        <div className="bg-zinc-900/50 p-8 rounded-full mb-6">
          <HeartOff className="h-12 w-12 text-zinc-500" />
        </div>
        <h1 className="text-2xl font-bold text-white uppercase tracking-[0.2em] mb-4">
          Your Collection is Empty
        </h1>
        <p className="text-zinc-400 max-w-md mb-8">
          Add movies, TV shows, and music to your collection to keep track of what you love.
        </p>
        <Link 
          href="/discover"
          className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
        >
          Explore Now
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-32 pb-32 px-6 md:px-16 lg:px-24">
      {/* Watchlist Section */}
      {watchItems.length > 0 && (
        <div className="mb-20">
          <div className="flex flex-col gap-2 mb-12">
            <h1 className="text-2xl font-bold text-white uppercase tracking-[0.2em]">
              MY WATCH LIST
            </h1>
            <p className="text-zinc-500 text-sm font-medium">
              {watchItems.length} {watchItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {watchItems.map((item) => (
                <motion.div
                  key={`${item.id}-${item.media_type}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative"
                >
                  <Link 
                    href={`/${item.media_type}/${item.id}`}
                    className="block relative aspect-video overflow-hidden rounded-xl bg-zinc-900 shadow-2xl ring-1 ring-white/5"
                  >
                    <img
                      src={getImageUrl(item.backdrop_path)}
                      alt={item.title || item.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
                    <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
                      <div className="flex items-center gap-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        <span>{item.media_type}</span>
                        <span className="h-1 w-1 rounded-full bg-zinc-700" />
                        <span>{item.release_date?.split("-")[0] || item.first_air_date?.split("-")[0]}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-2 line-clamp-1">{item.title || item.name}</h3>
                    </div>
                  </Link>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWatchlist(item.id as number, item.media_type as any);
                    }}
                    className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

        {/* Music Section */}
        {musicItems.length > 0 && (
          <div>
            <div className="flex flex-col gap-2 mb-12">
              <h1 className="text-2xl font-bold text-white uppercase tracking-[0.2em]">
                MUSIC COLLECTION
              </h1>
              <p className="text-zinc-500 text-sm font-medium">
                {musicItems.length} {musicItems.length === 1 ? 'song' : 'songs'} saved
              </p>
            </div>


          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {musicItems.map((item) => (
                <motion.div
                  key={`${item.id}-${item.media_type}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative"
                >
                  <Link 
                    href={`/music/play/${item.id}`}
                    className="block relative aspect-square overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl ring-1 ring-white/5"
                  >
                    <img
                      src={item.backdrop_path}
                      alt={item.title || item.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <h3 className="text-sm font-bold text-white line-clamp-1" dangerouslySetInnerHTML={{ __html: item.title || item.name || "" }} />
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">MUSIC</p>
                    </div>
                  </Link>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWatchlist(item.id, "music");
                    }}
                    className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </main>
  );
}
