"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

const STUDIOS = [
  { id: "marvel",     name: "Marvel Studios",  companyId: 420,   color: "from-[#ed1d24] to-[#f78f1e]" },
  { id: "dc",         name: "DC Studios",      companyId: 9993,  color: "from-[#0476f2] to-[#004ca3]" },
  { id: "disney",     name: "Disney+",         providerId: 337,  color: "from-[#001d66] to-[#001033]" },
  { id: "netflix",    name: "Netflix",         providerId: 8,    color: "from-[#e50914] to-[#b20710]" },
  { id: "hbo",        name: "HBO Max",         providerId: 1899, color: "from-[#991bfa] to-[#6014b2]" },
  { id: "prime",      name: "Prime Video",     providerId: 119,  color: "from-[#00a8e1] to-[#007eb9]" },
  { id: "apple",      name: "Apple TV+",       providerId: 350,  color: "from-[#555555] to-[#222222]" },
  { id: "hulu",       name: "Hulu",            providerId: 15,   color: "from-[#1ce783] to-[#17b165]" },
  { id: "warner",     name: "Warner Bros",     companyId: 174,   color: "from-[#004c99] to-[#00264d]" },
  { id: "universal",  name: "Universal",       companyId: 33,    color: "from-[#444444] to-[#111111]" },
  { id: "paramount",  name: "Paramount+",      providerId: 531,  color: "from-[#0064ff] to-[#003280]" },
  { id: "sony",       name: "Sony Pictures",   companyId: 34,    color: "from-[#555555] to-[#222222]" },
  { id: "pixar",      name: "Pixar",           companyId: 3,     color: "from-[#444444] to-[#111111]" },
  { id: "a24",        name: "A24",             companyId: 41077, color: "from-[#555555] to-[#111111]" },
  { id: "ghibli",     name: "Studio Ghibli",   companyId: 10342, color: "from-[#00a5e5] to-[#006da0]" },
  { id: "20th",       name: "20th Century",    companyId: 25,    color: "from-[#ffcc00] to-[#cc9900]" },
  { id: "peacock",    name: "Peacock",         providerId: 386,  color: "from-[#333333] to-[#111111]" },
  { id: "crunchyroll",name: "Crunchyroll",     providerId: 283,  color: "from-[#f47521] to-[#cb5a12]" },
  { id: "amc",        name: "AMC+",            providerId: 528,  color: "from-[#333333] to-[#111111]" },
  { id: "showtime",   name: "Showtime",        providerId: 67,   color: "from-[#ff0000] to-[#990000]" },
  { id: "starz",      name: "Starz",           providerId: 43,   color: "from-[#333333] to-[#111111]" },
  { id: "bbc",        name: "BBC",             companyId: 3324,  color: "from-[#cc0000] to-[#111111]" },
  { id: "lionsgate",  name: "Lionsgate",       companyId: 1632,  color: "from-[#444444] to-[#111111]" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function StudiosModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const { setIsLoading } = useGlobalLoading();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleClick = (studio: typeof STUDIOS[number]) => {
    const query = studio.providerId
      ? `providerId=${studio.providerId}`
      : `companyId=${studio.companyId}`;
    setIsLoading(true);
    router.push(`/studios/${studio.id}?${query}&name=${encodeURIComponent(studio.name)}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.9 }}
            className="relative w-full max-w-md mx-4 mb-24 bg-neutral-950/95 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "75vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-3 flex-shrink-0">
              <h2 className="text-xl font-bold tracking-tight">Studios & Networks</h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 overscroll-contain px-2 pb-3">
              <div className="divide-y divide-white/5 rounded-2xl overflow-hidden bg-white/4">
                {STUDIOS.map((studio) => (
                  <button
                    key={studio.id}
                    onClick={() => handleClick(studio)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/6 active:bg-white/8 transition-colors text-left"
                  >
                    {/* Color swatch */}
                    <span className={`flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br ${studio.color} shadow-sm`} />
                    <span className="flex-1 text-sm font-medium text-white/80 hover:text-white">
                      {studio.name}
                    </span>
                    <span className="text-white/20 text-xs">›</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
