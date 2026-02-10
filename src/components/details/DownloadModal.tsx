"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Download, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: any;
  mediaType: "movie" | "tv";
  season?: number;
  episode?: number;
}

export function DownloadModal({
  isOpen,
  onClose,
  mediaItem,
  mediaType,
  season,
  episode,
}: DownloadModalProps) {
  const [links, setLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && mediaItem) {
      fetchLinks();
    }
  }, [isOpen, mediaItem, season, episode]);

  const fetchLinks = async () => {
    setIsLoading(true);
    setError(null);
    setLinks([]);
    try {
      const response = await fetch("/api/scrape-downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaItem, mediaType, season, episode }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setLinks(data);
    } catch (err: any) {
      console.error("Error fetching download links:", err);
      setError("Gidid-an ang pag-scrape o naay error sa server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[450px] bg-zinc-950 border-white/10 text-white rounded-3xl overflow-hidden p-0 gap-0 outline-none">
        <div className="relative p-5 sm:p-6 pt-10">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-[0.2em] text-center">
              Download Links
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-center text-[10px] sm:text-xs font-medium uppercase tracking-widest pt-2">
              {mediaItem.title || mediaItem.name}
              {season && episode ? ` • S${season} E${episode}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 scrollbar-hide">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 animate-pulse">
                  Searching for links...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <p className="text-sm font-medium text-zinc-400 px-4">{error}</p>
                <Button 
                  onClick={fetchLinks} 
                  variant="outline" 
                  className="mt-4 border-white/10 hover:bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest h-10 px-6"
                >
                  Retry
                </Button>
              </div>
            ) : links.length > 0 ? (
              <div className="grid gap-2.5">
                {links.map((link, index) => (
                    <motion.a
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group gap-3 relative overflow-hidden"
                    >
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {link.quality && (
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black leading-none uppercase tracking-tighter ${
                                link.quality === '4K' 
                                  ? 'bg-yellow-500 text-black' 
                                  : link.quality === '1080p'
                                  ? 'bg-primary text-black'
                                  : 'bg-zinc-700 text-zinc-100'
                              }`}>
                                {link.quality}
                              </span>
                            )}
                            {link.info && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-white/10 text-zinc-300 leading-none uppercase tracking-tighter">
                                {link.info}
                              </span>
                            )}
                          </div>
                        <span className="text-[11px] font-bold uppercase tracking-tight text-zinc-100 group-hover:text-primary transition-colors line-clamp-2 leading-snug break-all sm:break-words">
                          {link.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-widest truncate">
                            {new URL(link.url).hostname}
                          </span>
                        </div>
                      </div>
                      <div className="h-11 w-11 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-black transition-all shadow-lg shadow-primary/5">
                        <Download className="h-5 w-5" />
                      </div>
                    </motion.a>
                ))}
              </div>
            ) : (

              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center mb-2">
                  <Download className="h-8 w-8 text-zinc-700" />
                </div>
                <p className="text-sm font-medium text-zinc-500">No download links found.</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest leading-relaxed max-w-[200px]">
                  Try another source or check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
