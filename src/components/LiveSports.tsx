"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Trophy, Activity, Play } from "lucide-react";
import { getSports, getMatches, type Sport, type Match, getBadgeUrl, getPosterUrl } from "@/lib/sports";
import { useRouter } from "next/navigation";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { SnakeLoader } from "@/components/ui/snake-loader";

function MatchCard({ match, index, sportId }: { match: Match; index: number; sportId: string }) {
  const router = useRouter();
  const { setIsLoading } = useGlobalLoading();
  const isLive = match.date <= Date.now();
  
  const getSportIcon = (sport: string) => {
    const s = (sport || 'soccer').toLowerCase();
    if (s.includes('basketball')) return '/sports/basketball.svg';
    if (s.includes('football') || s.includes('soccer')) return '/sports/soccer.svg';
    if (s.includes('tennis')) return '/sports/tennis.svg';
    if (s.includes('hockey')) return '/sports/hockey.svg';
    return '/sports/generic.svg';
  };

    const posterUrl = getPosterUrl(match);

    const handleClick = () => {
      setIsLoading(true);
      router.push(`/live-sports/play/${match.id}?title=${encodeURIComponent(match.title)}&sportId=${sportId}`);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: index * 0.05 }}
        className="relative flex-none w-[85%] md:w-[45%] lg:w-[30%] group cursor-pointer"
        onClick={handleClick}
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 shadow-2xl">

            {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={match.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
          
          <div className={`absolute inset-0 flex items-center justify-center bg-zinc-900 ${posterUrl ? 'hidden' : ''}`}>
            <div className="flex flex-col items-center gap-4 opacity-20">
              <Trophy className="w-16 h-16 text-white" />
              <span className="text-xs font-black uppercase tracking-widest">{match.sport}</span>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              {isLive ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-700 rounded-full">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">
                    {match.date > 0 ? new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Upcoming'}
                  </span>
                </div>
              )}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Play className="w-5 h-5 text-black fill-current" />
                </div>
              </div>
            </div>

              <div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex -space-x-2">
                      {match.teams?.home && (
                        <div className="w-6 h-6 rounded-full bg-white p-0.5 shadow-sm overflow-hidden flex items-center justify-center">
                          {match.teams.home.badge ? (
                            <img src={getBadgeUrl(match.teams.home.badge)} alt={match.teams.home.name} className="w-full h-full object-contain" />
                          ) : (
                            <Trophy className="w-3 h-3 text-zinc-400" />
                          )}
                        </div>
                      )}
                      {match.teams?.away && (
                        <div className="w-6 h-6 rounded-full bg-white p-0.5 shadow-sm overflow-hidden flex items-center justify-center">
                          {match.teams.away.badge ? (
                            <img src={getBadgeUrl(match.teams.away.badge)} alt={match.teams.away.name} className="w-full h-full object-contain" />
                          ) : (
                            <Trophy className="w-3 h-3 text-zinc-400" />
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      {match.sport || sportId}
                    </span>
                  </div>
                <h3 className="text-lg font-black text-white leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                  {match.title}
                  </h3>
                </div>
            </div>
          </div>
      </motion.div>

  );
}

function SportSection({ sport }: { sport: Sport }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMatches() {
      const data = await getMatches(sport.id);
      // Strictly filter matches by sport category to avoid mixing
          const filtered = data.filter(m => {
            const matchSport = (m.sport || (m as any).category || '').toLowerCase().trim();
            const sportId = sport.id.toLowerCase().trim();
            
            if (!matchSport) return false;
            
            // Stricter matching
            if (sportId === 'basketball') return matchSport === 'basketball' || matchSport.includes('nba') || matchSport.includes('wnba');
            if (sportId === 'football' || sportId === 'soccer') return matchSport === 'soccer' || matchSport === 'football' || matchSport.includes('league') || matchSport.includes('cup');
            if (sportId === 'fight') return matchSport === 'ufc' || matchSport === 'boxing' || matchSport === 'fight' || matchSport.includes('mma');
            
            // Direct match or specific inclusion
            if (matchSport === sportId) return true;
            return matchSport.includes(sportId) && !matchSport.includes('soccer') && !matchSport.includes('football');
          });
      setMatches(filtered);
      setLoading(false);
    }
    fetchMatches();
  }, [sport.id]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth * 0.8 
        : scrollLeft + clientWidth * 0.8;
      
      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth"
      });
    }
  };

  if (!loading && matches.length === 0) return null;

  return (
    <div className="mb-12 last:mb-0 group/section relative">
      <div className="flex items-center justify-between mb-6 px-4">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <span className="w-1.5 h-6 bg-primary rounded-full" />
          {sport.name}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-full bg-zinc-900 text-white hover:bg-white hover:text-black transition-all border border-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-full bg-zinc-900 text-white hover:bg-white hover:text-black transition-all border border-white/5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 scrollbar-hide px-4 pb-8 scroll-smooth overscroll-x-contain"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-none w-[85%] md:w-[45%] lg:w-[30%] aspect-video bg-zinc-900 animate-pulse rounded-2xl border border-white/5" />
          ))
        ) : (
          matches.map((match, index) => (
            <MatchCard key={match.id} match={match} index={index} sportId={sport.id} />
          ))
        )}
      </div>
    </div>
  );
}

export function LiveSports() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSports() {
      const data = await getSports();
      // Ensure basketball is featured if available
      const sorted = [...data].sort((a, b) => {
        if (a.id === 'basketball') return -1;
        if (b.id === 'basketball') return 1;
        return 0;
      });
      setSports(sorted);
      setLoading(false);
    }
    fetchSports();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-20 flex items-center justify-center">
        <SnakeLoader size="lg" />
      </div>
    );
  }

  return (
    <section className="w-full py-10 px-0 overflow-visible relative">
      {sports.map((sport) => (
        <SportSection key={sport.id} sport={sport} />
      ))}
    </section>
  );
}
