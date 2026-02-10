"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Album, Song, useMusic } from "@/hooks/useMusic";
import { Play, Pause, Plus, Clock, Disc, ArrowLeft, Heart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AlbumDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentSong, isPlaying, playSong, addToQueue } = useMusic();

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const res = await fetch(`https://jiosaavn-api-privatecvc2.vercel.app/albums?id=${id}`);
        const data = await res.json();
        if (data.status === "SUCCESS") {
          setAlbum(data.data);
        }
      } catch (error) {
        console.error("Error fetching album:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbum();
  }, [id]);

  const handlePlayAll = () => {
    if (album?.songs && album.songs.length > 0) {
      playSong(album.songs[0]);
      album.songs.slice(1).forEach(song => addToQueue(song));
    }
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

  const formatDuration = (seconds: string) => {
    const s = parseInt(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-32 pt-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            <Skeleton className="w-64 h-64 rounded-2xl shadow-2xl" />
            <div className="space-y-4 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!album) return null;

  const imageUrl = album.image.find(img => img.quality === "500x500")?.link || album.image[album.image.length - 1].link;

    return (
      <main className="min-h-screen bg-background pb-32 relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 h-[50vh] -z-10">
          <div 
            className="absolute inset-0 bg-cover bg-center blur-[100px] opacity-[0.03]"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </div>
  
        <div className="max-w-5xl mx-auto pt-24 px-4 md:px-8">
          <button 
            onClick={() => router.back()}
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all mb-8 backdrop-blur-md"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
  
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-end mb-16">
            <div className="relative flex-shrink-0">
              <img 
                src={imageUrl} 
                alt={album.name} 
                className="w-48 h-48 md:w-56 md:h-56 rounded-lg shadow-2xl object-cover"
              />
            </div>
  
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">
                  <span>Album</span>
                  <span className="opacity-30">•</span>
                  <span>{album.year}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight" dangerouslySetInnerHTML={{ __html: album.name }} />
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
                  <span className="text-foreground/80" dangerouslySetInnerHTML={{ __html: getArtistsString(album.primaryArtists) }} />
                  <span className="opacity-20">•</span>
                  <span>{album.songCount} songs</span>
                </div>
              </div>
  
              <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                <Button size="sm" className="h-9 px-6 rounded-full font-semibold gap-2 bg-foreground text-background hover:bg-foreground/90" onClick={handlePlayAll}>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Play All
                </Button>
              </div>
            </div>
          </div>
  
            {/* Songs List */}
            <div className="space-y-1">
              {album.songs?.map((song, index) => {
                const isCurrent = currentSong?.id === song.id;
                const songImageUrl = song.image?.find(img => img.quality === "150x150")?.link || 
                                    song.image?.[0]?.link || 
                                    imageUrl;

                return (
                  <div 
                    key={song.id}
                    onClick={() => playSong(song)}
                    className={cn(
                      "flex items-center gap-4 p-3 cursor-pointer transition-all rounded-xl group relative overflow-hidden",
                      isCurrent ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                    )}
                  >
                    {/* Index Number */}
                    <div className="flex-shrink-0 w-6 text-center">
                      {isCurrent && isPlaying ? (
                        <div className="flex gap-0.5 items-end h-3 justify-center">
                          <div className="w-0.5 bg-primary animate-[music-bar-1_0.8s_ease-in-out_infinite]" />
                          <div className="w-0.5 bg-primary animate-[music-bar-2_0.8s_ease-in-out_infinite]" />
                          <div className="w-0.5 bg-primary animate-[music-bar-3_0.8s_ease-in-out_infinite]" />
                        </div>
                      ) : (
                        <span className={cn(
                          "text-xs font-bold tabular-nums transition-colors",
                          isCurrent ? "text-primary" : "text-muted-foreground/30 group-hover:text-muted-foreground/60"
                        )}>
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    <div className="relative flex-shrink-0 w-12 h-12">
                      <img 
                        src={songImageUrl} 
                        alt={song.name}
                        className="w-full h-full object-cover rounded-lg shadow-lg"
                      />
                      <div className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg transition-opacity",
                        isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        {!isCurrent && <Play className="w-4 h-4 text-white fill-current" />}
                        {isCurrent && !isPlaying && <Play className="w-4 h-4 text-primary fill-current" />}
                        {isCurrent && isPlaying && <Pause className="w-4 h-4 text-primary fill-current" />}
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-bold uppercase tracking-wider truncate",
                          isCurrent ? "text-primary" : "text-foreground/90"
                        )} dangerouslySetInnerHTML={{ __html: song.name }} />
                        {isCurrent && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 rounded-[4px] bg-primary/10 text-[8px] font-black tracking-[0.2em] text-primary uppercase">
                            Now Playing
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground/40 font-bold uppercase tracking-widest truncate" dangerouslySetInnerHTML={{ __html: getArtistsString(song.primaryArtists) }} />
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(song);
                        }}
                          className="p-2 rounded-full hover:bg-white/10 text-muted-foreground/30 hover:text-primary transition-all opacity-100"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <div className="flex-shrink-0 text-[11px] font-bold text-muted-foreground/20 tabular-nums tracking-widest group-hover:text-muted-foreground/40 transition-colors">
                        {formatDuration(song.duration)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </main>
    );
  }

