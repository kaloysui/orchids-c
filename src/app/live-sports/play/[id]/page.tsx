"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { getStream, getMatches, type Stream, type MatchSource } from "@/lib/sports";
import { X, Share2, Info, Loader2, Play, Activity, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

export default function SportsPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const { setIsLoading } = useGlobalLoading();
  
  const id = params.id as string;
  const title = searchParams.get("title") || "Live Match";
  const sportId = searchParams.get("sportId") || "";
  
  const [sources, setSources] = useState<MatchSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<MatchSource | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStreams, setLoadingStreams] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBack = () => {
      setIsLoading(true);
      router.push('/live-sports');
    };


    // Fetch match details to get sources
    useEffect(() => {
      async function fetchMatchDetails() {
        try {
          setLoading(true);
          setError(null);
          
          // Try fetching from the specific sport first
          const fetchId = sportId || 'all';
          const matches = await getMatches(fetchId);
          let match = matches.find(m => m.id === id);
          
          // If not found and we had a sportId, try 'all' but as a last resort
          // To make it faster, we'll only do this if strictly necessary
          if (!match && sportId && sportId !== 'all') {
            // Check if match might be in 'other' or 'all'
            const allMatches = await getMatches('all');
            match = allMatches.find(m => m.id === id);
          }
          
          if (match && match.sources && match.sources.length > 0) {
            const processedSources = match.sources.map(s => ({
              ...s,
              name: s.name || s.source || "Server"
            }));
            setSources(processedSources);
            setSelectedSource(processedSources[0]);
          } else if (match) {
            setError("No streaming sources available for this match yet.");
          } else {
            // Special case: if we can't find the match but we have the ID, 
            // some sources might be guessable or we can try a direct stream fetch
            // with a dummy source if we know the patterns, but it's better to show error
            setError("Match not found. It might have ended or the link is invalid.");
          }
        } catch (err) {
          console.error("Error fetching match details:", err);
          setError("Failed to load match details. Please check your connection.");
        } finally {
          setLoading(false);
        }
      }
      
      fetchMatchDetails();
    }, [id, sportId]);

    // Fetch streams for selected source
    useEffect(() => {
      async function fetchStreams() {
        if (selectedSource) {
          setLoadingStreams(true);
          try {
            // The API expects the 'source' identifier (e.g., 'alpha', 'bravo', 'admin')
            // MatchSource interface: { id: string, source: string, name?: string }
            const sourceIdentifier = selectedSource.source;
            if (!sourceIdentifier) {
              setStreams([]);
              setSelectedStream(null);
              return;
            }

            const data = await getStream(sourceIdentifier, selectedSource.id);
            
            setStreams(data || []);
            if (data && data.length > 0) {
              setSelectedStream(data[0]);
            } else {
              setSelectedStream(null);
            }
          } catch (err) {
            console.error("Error fetching streams:", err);
            setStreams([]);
            setSelectedStream(null);
          } finally {
            setLoadingStreams(false);
          }
        }
      }
      fetchStreams();
    }, [selectedSource]);

    const handleShare = async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: title,
            text: `Watch ${title} live on Orchids Sports!`,
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          // Show a simple toast or alert
          const toast = document.createElement('div');
          toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-full shadow-2xl z-[100] animate-bounce';
          toast.innerText = 'Link Copied!';
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 2000);
        }
      } catch (err) {
        console.error("Error sharing:", err);
      }
    };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Floating UI Controls */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 z-50 flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-900/90 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50"
            title="Close"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-900/90 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-zinc-800 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50"
          title="Share"
        >
          <Share2 className="w-5 h-5 md:w-6 md:h-6" />
        </motion.button>
      </div>

      <div className="max-w-[1600px] mx-auto pt-24 pb-20 px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Player Section */}
              <div className="lg:col-span-3 space-y-6">
                <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl shadow-primary/5">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key="loading"
                        className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                      >
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs">Loading Match Data...</p>
                      </motion.div>
                    ) : error ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key="error"
                        className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center"
                      >
                        <AlertCircle className="w-16 h-16 text-red-500" />
                        <div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Error</h3>
                          <p className="text-zinc-500 max-w-xs mt-2 font-medium uppercase text-xs tracking-widest">
                            {error}
                          </p>
                          <button 
                            onClick={() => window.location.reload()}
                            className="mt-6 px-6 py-2 bg-white text-black text-xs font-black uppercase tracking-widest rounded-full hover:bg-primary transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      </motion.div>
                    ) : selectedStream ? (
                      <motion.iframe
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={selectedStream.embedUrl}
                        src={selectedStream.embedUrl}
                        className="w-full h-full border-0"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
                        {loadingStreams ? (
                          <>
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs">Finding Servers...</p>
                          </>
                        ) : (
                          <>
                            <Play className="w-16 h-16 text-primary animate-pulse" />
                            <div>
                              <h3 className="text-2xl font-black uppercase tracking-tighter">
                                {sources.length > 0 ? "Select a Server" : "No Sources Available"}
                              </h3>
                              <p className="text-zinc-500 max-w-xs mt-2 font-medium">
                                {sources.length > 0 
                                  ? "Please choose one of the available sources on the right to start watching."
                                  : "We couldn't find any live sources for this match right now."}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/10 border border-red-600/20 rounded-full">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-600">Live Now</span>
                    </div>
                    {sources.map((src, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSource(src)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                          selectedSource?.id === src.id
                            ? "bg-primary text-black"
                            : "bg-zinc-900 text-zinc-500 hover:text-white border border-white/5"
                        }`}
                      >
                        {src.name}
                      </button>
                    ))}
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">{title}</h1>
                </div>
              </div>

              {/* Sources/Streams Sidebar */}
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-zinc-500 font-black uppercase tracking-widest text-xs">
                      <Activity className="w-4 h-4 text-primary" />
                      Servers for {selectedSource?.name || "Match"}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-black text-zinc-400">{streams.length} Online</span>
                  </div>
                  
                  <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-hide pr-2">
                    {loadingStreams ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="w-full h-20 bg-zinc-900/50 animate-pulse rounded-2xl border border-white/5" />
                      ))
                    ) : (
                      <>
                        {streams.map((stream, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedStream(stream)}
                            className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                              selectedStream?.embedUrl === stream.embedUrl
                                ? "bg-primary border-primary text-black"
                                : "bg-zinc-900/50 border-white/5 text-white hover:bg-zinc-800 hover:border-white/10"
                            }`}
                          >
                            <div className="flex flex-col gap-1">
                              <span className="font-black uppercase tracking-tight text-sm flex items-center gap-2">
                                {stream.name} 
                                {stream.hd && <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${
                                  selectedStream?.embedUrl === stream.embedUrl ? "bg-black text-white" : "bg-primary/20 text-primary"
                                }`}>HD</span>}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                  selectedStream?.embedUrl === stream.embedUrl ? "text-black/60" : "text-zinc-500"
                                }`}>
                                  {stream.language}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                  selectedStream?.embedUrl === stream.embedUrl ? "text-black/60" : "text-zinc-500"
                                }`}>
                                  {stream.source}
                                </span>
                              </div>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              selectedStream?.embedUrl === stream.embedUrl ? "bg-black/10" : "bg-zinc-800 group-hover:bg-primary group-hover:text-black"
                            }`}>
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </div>
                          </button>
                        ))}

                        {!loading && !loadingStreams && streams.length === 0 && selectedSource && (
                          <div className="p-12 rounded-3xl border-2 border-dashed border-white/5 text-center bg-zinc-900/20">
                            <p className="text-zinc-600 text-sm font-black uppercase tracking-widest">No Servers Available for this source</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>


              <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
                <h3 className="font-black uppercase tracking-tight text-sm flex items-center gap-2 text-primary">
                  <Info className="w-4 h-4" />
                  Streaming Tip
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed uppercase tracking-wider">
                  Experiencing lag? Switch to another server or source. Different providers might have better connections for your region.
                </p>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
