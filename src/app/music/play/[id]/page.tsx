"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Song, useMusic } from "@/hooks/useMusic";
import { 
  Play, 
  Pause, 
  ArrowLeft, 
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MusicSection } from "@/components/music/MusicSection";
import { motion } from "framer-motion";
import { LyricsModal } from "@/components/music/LyricsModal";
import { QueueSidebar } from "@/components/music/QueueSidebar";

export default function MusicPlayPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentSong, isPlaying, togglePlay, playSong, progress, duration, seek, skipForward, skipBackward } = useMusic();
  
  const [songDetails, setSongDetails] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string | any[] | null>(null);
  const [lyricsType, setLyricsType] = useState<"plain" | "synced">("plain");
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  useEffect(() => {
    if (currentSong && currentSong.id !== id) {
      router.replace(`/music/play/${currentSong.id}`);
    }
  }, [currentSong, id, router]);

  useEffect(() => {
    async function fetchSongDetails() {
      try {
        const res = await fetch(`https://jiosaavn-api-privatecvc2.vercel.app/songs?id=${id}`);
        const data = await res.json();
        if (data.status === "SUCCESS" && data.data?.[0]) {
          const song = data.data[0];
          setSongDetails(song);
          // Only play if there's no current song or if we explicitly navigated to a different one
          if (!currentSong || (currentSong.id !== song.id && !isPlaying)) {
            playSong(song);
          }
        }
      } catch (error) {
        console.error("Error fetching song details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSongDetails();
  }, [id]);

  const fetchLyrics = async () => {
    if (lyrics && lyrics !== "Lyrics not available for this song." && lyrics !== "Failed to load lyrics.") return;
    setLoadingLyrics(true);
    try {
      const title = activeSong.name.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      const artist = activeSong.primaryArtists.split(',')[0].trim();
      const res = await fetch(`/api/music/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
      const data = await res.json();
      if (data.lyrics) {
        setLyrics(data.lyrics);
        setLyricsType(data.type || "plain");
      } else {
        setLyrics("Lyrics not available for this song.");
        setLyricsType("plain");
      }
    } catch (error) {
      setLyrics("Failed to load lyrics.");
    } finally {
      setLoadingLyrics(false);
    }
  };

  const activeSong = songDetails || currentSong;

  if (loading && !activeSong) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeSong) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Song not found</p>
        <Button onClick={() => router.push("/music")}>Back to Music</Button>
      </div>
    );
  }

  const imageUrl = activeSong.image.find(img => img.quality === "500x500")?.link || activeSong.image[activeSong.image.length - 1].link;

  const getPlayCount = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    const base = Math.abs(hash % 99) + 1;
    return `${base}.${Math.abs(hash % 9)}M plays`;
  };

  const playCount = getPlayCount(activeSong.id);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-32 relative overflow-x-hidden">
      {/* Dynamic Background Blur */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div 
          className="absolute inset-0 bg-cover bg-center blur-[100px] opacity-20 scale-150 transition-all duration-1000"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-[60] px-4 py-6 flex items-center justify-between bg-transparent max-w-7xl mx-auto w-full">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.replace("/music")}
          className="rounded-full bg-background/20 backdrop-blur-xl border border-white/10 hover:bg-white/10"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Now Playing</div>
        <QueueSidebar 
          trigger={
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-background/20 backdrop-blur-xl border border-white/10 hover:bg-white/10"
            >
              <span className="sr-only">Open Queue</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-music"><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>
            </Button>
          }
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4 space-y-16">
        {/* Main Player Area - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Cover Art */}
          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square w-full max-w-[500px] mx-auto overflow-hidden rounded-[32px] bg-muted border border-white/10 shadow-2xl"
            >
              <img
                src={imageUrl}
                alt={activeSong.name}
                className="object-cover w-full h-full"
              />
            </motion.div>
          </div>

          {/* Info & Controls */}
          <div className="flex flex-col gap-8">
            <div className="text-left space-y-4">
              <h1 
                className="text-4xl md:text-6xl font-black tracking-tighter leading-tight" 
                dangerouslySetInnerHTML={{ __html: activeSong.name }} 
              />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground font-bold text-xl">
                  <span 
                    className="text-primary hover:underline cursor-pointer transition-all" 
                    dangerouslySetInnerHTML={{ __html: activeSong.primaryArtists }} 
                  />
                </div>
                <div className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">
                  {playCount} • 320kbps HQ
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={skipBackward}
                  className="h-12 w-12 rounded-full text-muted-foreground hover:text-foreground transition-all"
                >
                  <SkipBack className="w-6 h-6 fill-current" />
                </Button>

                <Button 
                  onClick={togglePlay}
                  className="h-16 w-16 rounded-full bg-foreground text-background hover:scale-110 active:scale-90 transition-all shadow-xl flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-current" />
                  ) : (
                    <Play className="w-8 h-8 fill-current ml-1" />
                  )}
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={skipForward}
                  className="h-12 w-12 rounded-full text-muted-foreground hover:text-foreground transition-all"
                >
                  <SkipForward className="w-6 h-6 fill-current" />
                </Button>
              </div>

              <Button 
                variant="ghost" 
                onClick={() => {
                  if (!showLyrics) fetchLyrics();
                  setShowLyrics(!showLyrics);
                }}
                className="rounded-full px-6 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-all"
              >
                {showLyrics ? "Hide Lyrics" : "Show Lyrics"}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="relative group h-6 flex items-center">
                <Slider
                  value={[progress]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={([val]) => seek(val)}
                  className="relative flex items-center select-none touch-none w-full h-1.5 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[11px] font-black tracking-[0.2em] text-muted-foreground opacity-60">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-16 pt-16 border-t border-white/5">
          <MusicSection 
            title={`More from ${activeSong.primaryArtists.split(',')[0]}`} 
            query={activeSong.primaryArtists.split(',')[0]} 
          />
          <MusicSection 
            title="Related Songs" 
            query={activeSong.name.split(' ')[0]} 
          />
        </div>
      </div>

      <LyricsModal
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
        lyrics={lyrics}
        lyricsType={lyricsType}
        loading={loadingLyrics}
        progress={progress}
        songName={activeSong.name}
        artistName={activeSong.primaryArtists}
      />
    </main>
  );
}
