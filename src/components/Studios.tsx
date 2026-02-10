"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Library, Layers } from "lucide-react";

const STUDIOS = [
  {
    id: "marvel",
    name: "Marvel Studios",
    companyId: 420,
    color: "from-[#ed1d24] to-[#f78f1e]"
  },
  {
    id: "dc",
    name: "DC Studios",
    companyId: 9993,
    color: "from-[#0476f2] to-[#004ca3]"
  },
  {
    id: "disney",
    name: "Disney+",
    providerId: 337,
    color: "from-[#001d66] to-[#001033]"
  },
  {
    id: "netflix",
    name: "Netflix",
    providerId: 8,
    color: "from-[#e50914] to-[#b20710]"
  },
  {
    id: "hbo",
    name: "HBO Max",
    providerId: 1899,
    color: "from-[#991bfa] to-[#6014b2]"
  },
  {
    id: "prime",
    name: "Prime Video",
    providerId: 119,
    color: "from-[#00a8e1] to-[#007eb9]"
  },
  {
    id: "apple",
    name: "Apple TV+",
    providerId: 350,
    color: "from-[#ffffff] to-[#cccccc]"
  },
  {
    id: "hulu",
    name: "Hulu",
    providerId: 15,
    color: "from-[#1ce783] to-[#17b165]"
  },
  {
    id: "warner",
    name: "Warner Bros",
    companyId: 174,
    color: "from-[#004c99] to-[#00264d]"
  },
  {
    id: "universal",
    name: "Universal",
    companyId: 33,
    color: "from-[#1a1a1a] to-[#000000]"
  },
  {
    id: "paramount",
    name: "Paramount+",
    providerId: 531,
    color: "from-[#0064ff] to-[#003280]"
  },
  {
    id: "sony",
    name: "Sony Pictures",
    companyId: 34,
    color: "from-[#ffffff] to-[#999999]"
  },
  {
    id: "pixar",
    name: "Pixar",
    companyId: 3,
    color: "from-[#ffffff] to-[#333333]"
  },
  {
    id: "a24",
    name: "A24",
    companyId: 41077,
    color: "from-[#ffffff] to-[#111111]"
  },
  {
    id: "ghibli",
    name: "Studio Ghibli",
    companyId: 10342,
    color: "from-[#00a5e5] to-[#006da0]"
  },
  {
    id: "20th",
    name: "20th Century",
    companyId: 25,
    color: "from-[#ffcc00] to-[#cc9900]"
  },
  {
    id: "peacock",
    name: "Peacock",
    providerId: 386,
    color: "from-[#000000] to-[#333333]"
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    providerId: 283,
    color: "from-[#f47521] to-[#cb5a12]"
  },
  {
    id: "amc",
    name: "AMC+",
    providerId: 528,
    color: "from-[#000000] to-[#222222]"
  },
  {
    id: "showtime",
    name: "Showtime",
    providerId: 67,
    color: "from-[#ff0000] to-[#990000]"
  },
  {
    id: "starz",
    name: "Starz",
    providerId: 43,
    color: "from-[#000000] to-[#111111]"
  },
  {
    id: "bbc",
    name: "BBC",
    companyId: 3324,
    color: "from-[#ff0000] to-[#000000]"
  },
  {
    id: "lionsgate",
    name: "Lionsgate",
    companyId: 1632,
    color: "from-[#000000] to-[#444444]"
  }
];

export function Studios() {
  return (
    <section id="studios" className="w-full py-20 px-4 md:px-6 overflow-hidden">
      <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-6xl mx-auto">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
            <Library className="w-3 h-3" />
            Media Powerhouses
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase leading-none">
            Studios & <span className="text-primary">Networks</span>
          </h2>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            The world's biggest production companies and streaming platforms.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {STUDIOS.length} Providers
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-24 max-w-7xl mx-auto">
        {STUDIOS.map((studio, index) => (
          <StudioCard key={studio.id} studio={studio} index={index} />
        ))}
      </div>
    </section>
  );
}

function StudioCard({ studio, index }: { studio: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      viewport={{ once: true }}
    >
      <Link
        href={`/studios/${studio.id}?${studio.providerId ? `providerId=${studio.providerId}` : `companyId=${studio.companyId}`}&name=${encodeURIComponent(studio.name)}`}
        className="group relative flex flex-col gap-6"
      >
        {/* Stacked Cards Effect */}
        <div className="relative h-[220px] w-full flex items-center justify-center">
          {/* Third Layer */}
          <div className={`absolute w-[180px] aspect-video rounded-lg overflow-hidden shadow-2xl transition-all duration-700 group-hover:duration-500 border border-border opacity-20 group-hover:opacity-40 -translate-x-12 rotate-[-12deg] group-hover:-translate-x-16 group-hover:rotate-[-18deg] group-hover:-translate-y-2 bg-gradient-to-br ${studio.color}`} />

          {/* Second Layer */}
          <div className={`absolute w-[180px] aspect-video rounded-lg overflow-hidden shadow-2xl transition-all duration-700 group-hover:duration-500 border border-border opacity-30 group-hover:opacity-60 translate-x-12 rotate-[12deg] group-hover:translate-x-16 group-hover:rotate-[18deg] group-hover:-translate-y-2 bg-gradient-to-br ${studio.color}`} />

          {/* Main Top Card */}
          <div className={`absolute w-[220px] aspect-video rounded-xl overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-4 border border-border z-10 bg-gradient-to-br ${studio.color} flex items-center justify-center p-6`}>
            <span className="text-xl md:text-2xl font-black uppercase tracking-tighter italic text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] text-center leading-tight">
              {studio.name}
            </span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Glow Effect */}
          <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-700 -z-10" />
        </div>

        {/* Content */}
        <div className="relative space-y-2 px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Layers className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
              Studio Archive
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight italic uppercase">
            {studio.name}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}
