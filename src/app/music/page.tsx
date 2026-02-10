"use client";

import { useState, useRef } from "react";
import { MusicSection } from "@/components/music/MusicSection";
import { MusicSearch } from "@/components/music/MusicSearch";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function MusicPage() {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchClick = () => {
    setIsSearchActive(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleCloseSearch = () => {
    setIsSearchActive(false);
    setSearchQuery("");
  };

  return (
<main className="min-h-screen bg-background pb-32">
{/* Hero / Search Section */}
<div className="relative pt-24 pb-8 px-4 md:px-8 overflow-hidden transition-all duration-500">
<div className="max-w-7xl mx-auto space-y-6">
<div className="max-w-2xl relative group">
<div className="relative flex items-center">
<Search className="absolute left-5 h-5 w-5 text-muted-foreground transition-colors z-10" />
<Input
ref={searchInputRef}
value={searchQuery}
onChange={(e) => {
setSearchQuery(e.target.value);
if (!isSearchActive) setIsSearchActive(true);
}}
onClick={handleSearchClick}
placeholder="Search music..."
className="h-12 pl-14 pr-12 rounded-full bg-muted/30 hover:bg-muted/50 border-none text-lg transition-all w-full focus:ring-1 focus:ring-primary/30"
/>
{isSearchActive && (
<button 
onClick={handleCloseSearch}
className="absolute right-4 p-1.5 hover:bg-muted rounded-full transition-colors z-10"
>
<X className="h-4 w-4 text-muted-foreground" />
</button>
)}
</div>
</div>
</div>
</div>

<div className="max-w-7xl mx-auto px-4 md:px-8">
        <AnimatePresence mode="wait">
          {isSearchActive ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8"
            >
              <MusicSearch 
                initialQuery={searchQuery} 
                onClose={handleCloseSearch} 
              />
            </motion.div>
          ) : (
            <div className="space-y-20 mt-12">
              <MusicSection title="Global Hot 100" query="billboard hot 100 english" />
              <MusicSection title="Popular Albums" query="popular global english albums billboard 200" variant="album" />
              <MusicSection title="Popular Artists" query="popular global artists rex orange county justin bieber post malone taylor swift billie eilish" variant="artist" />
              <MusicSection title="Trending English Hits" query="billboard hot 100 global popular hits 2026" />
              <MusicSection title="Viral 50 Global" query="viral 50 global english" />
              <MusicSection title="Latest Hits" query="new english song releases 2026" />
            </div>

          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
