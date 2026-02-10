"use client";

import { useMusic, Song } from "@/hooks/useMusic";
import { Play, ListMusic, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

export function QueueSidebar({ trigger }: { trigger?: React.ReactNode }) {
  const { 
    currentSong, 
    queue, 
    removeFromQueue, 
    clearQueue, 
    playSong,
    getArtistsString
  } = useMusic();

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8 relative">
            <ListMusic className="h-4 w-4" />
            {queue.length > 0 && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-primary text-[8px] flex items-center justify-center rounded-full text-primary-foreground font-bold shadow-sm">
                {queue.length}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-[calc(100%-1rem)] sm:w-[400px] p-0 bg-background/80 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col h-[calc(100%-1rem)] sm:h-[calc(100%-2rem)] m-2 sm:m-4 rounded-[2.5rem] overflow-hidden transition-all duration-500 ring-1 ring-white/5"
      >
        <SheetHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between space-y-0 flex-shrink-0 bg-background/50 backdrop-blur-md">
          <div className="flex flex-col">
            <SheetTitle className="text-xl font-black tracking-tight">Queue</SheetTitle>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{queue.length} songs remaining</p>
          </div>
          {queue.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearQueue} className="h-8 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
              <Trash2 className="w-3 h-3 mr-1.5" />
              Clear
            </Button>
          )}
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar-hide">
          <div className="p-2 flex flex-col gap-1 pb-24">
            {currentSong && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 px-2">Now Playing</p>
                <div className="flex items-center gap-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                    <img 
                      src={currentSong.image.find(img => img.quality === "150x150")?.link || currentSong.image[0].link} 
                      alt={currentSong.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-primary" dangerouslySetInnerHTML={{ __html: currentSong.name }} />
                    <p className="text-xs text-muted-foreground truncate opacity-80" dangerouslySetInnerHTML={{ __html: getArtistsString(currentSong.primaryArtists) }} />
                  </div>

                  <div className="flex gap-1">
                    <div className="w-1 h-3 bg-primary animate-music-bar-1" />
                    <div className="w-1 h-3 bg-primary animate-music-bar-2" />
                    <div className="w-1 h-3 bg-primary animate-music-bar-3" />
                  </div>
                </div>
              </div>
            )}

            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-4 mb-2 px-2">Next in Queue ({queue.length})</p>
            
            {queue.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ListMusic className="w-6 h-6 text-muted-foreground opacity-20" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Your queue is empty</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Add some songs to keep the music playing</p>
              </div>
            ) : (
              <div className="space-y-1">
                {queue.map((song, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={`${song.id}-${index}`}
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/80 transition-all cursor-pointer border border-transparent hover:border-border"
                    onClick={() => playSong(song)}
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                      <img 
                        src={song.image.find(img => img.quality === "150x150")?.link || song.image[0].link} 
                        alt={song.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors" dangerouslySetInnerHTML={{ __html: song.name }} />
                      <p className="text-xs text-muted-foreground truncate opacity-70" dangerouslySetInnerHTML={{ __html: getArtistsString(song.primaryArtists) }} />
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(song.id);
                      }}
                        className="w-8 h-8 opacity-100 transition-all text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
