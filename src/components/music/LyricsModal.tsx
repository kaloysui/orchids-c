"use client";

import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Loader2, X } from "lucide-react";
import { motion } from "framer-motion";

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lyrics: string | any[] | null;
  lyricsType: "plain" | "synced";
  loading: boolean;
  progress: number;
  songName: string;
  artistName: string;
}

export function LyricsModal({
  isOpen,
  onClose,
  lyrics,
  lyricsType,
  loading,
  progress,
  songName,
  artistName
}: LyricsModalProps) {
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && lyricsType === "synced" && lyrics && Array.isArray(lyrics)) {
      const activeLine = lyrics.findIndex((line, i) => {
        const nextLine = lyrics[i + 1];
        return progress >= line.ts && (!nextLine || progress < nextLine.ts);
      });

      if (activeLine !== -1 && lyricsContainerRef?.current) {
        const lineElement = lyricsContainerRef.current.querySelector(`[data-line-index="${activeLine}"]`) as HTMLElement;
        if (lineElement) {
          lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [progress, isOpen, lyricsType, lyrics]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-[480px] h-[75vh] flex flex-col p-0 overflow-hidden bg-black/40 backdrop-blur-[60px] border-white/10 rounded-[2.5rem] shadow-2xl">
        <DialogClose className="absolute right-6 top-6 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all active:scale-90 group">
          <X className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
        </DialogClose>
        
        <DialogHeader className="p-8 border-b border-white/5 text-center">
          <DialogTitle className="flex flex-col gap-1 items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Lyrics</span>
            <span className="text-2xl font-black tracking-tight line-clamp-1 text-white" dangerouslySetInnerHTML={{ __html: songName }} />
            <span className="text-sm font-bold text-white/50 line-clamp-1" dangerouslySetInnerHTML={{ __html: artistName }} />
          </DialogTitle>
        </DialogHeader>

        <div 
          ref={lyricsContainerRef}
          className="flex-1 overflow-y-auto p-12 custom-scrollbar scroll-smooth text-center"
        >
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-white/40">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest">Finding Lyrics...</p>
            </div>
          ) : lyrics ? (
            <div className="space-y-10 pb-60">
              {lyricsType === "synced" && Array.isArray(lyrics) ? (
                lyrics.map((line, i) => {
                  const isActive = progress >= line.ts && (!lyrics[i + 1] || progress < lyrics[i + 1].ts);
                  return (
                      <motion.p
                        key={i}
                        data-line-index={i}
                        initial={false}
                        animate={{
                          opacity: isActive ? 1 : 0.2,
                          scale: isActive ? 1.05 : 1,
                        }}
                        className={`text-2xl md:text-3xl font-black leading-tight tracking-tighter transition-all duration-500 cursor-default select-none ${isActive ? 'text-white' : 'text-white/40'}`}
                      >
                      {line.x || line.l}
                    </motion.p>
                  );
                })
              ) : (
                  <p 
                    className="text-xl md:text-2xl font-black leading-relaxed tracking-tight whitespace-pre-wrap text-white/80"
                    dangerouslySetInnerHTML={{ __html: typeof lyrics === 'string' ? lyrics : "No lyrics found." }}
                  />
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/40">
              <p className="text-[10px] font-black uppercase tracking-widest">Lyrics not available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
