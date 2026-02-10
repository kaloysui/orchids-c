"use client";

import { LiveSports } from "@/components/LiveSports";
import { Trophy, Home } from "lucide-react";
import Link from "next/link";

export default function LiveSportsPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="pt-32 pb-8 px-4 md:px-8 max-w-[1600px] mx-auto">
        <header className="mb-12 flex flex-col items-center text-center gap-2">
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase flex flex-col md:flex-row items-center gap-0 md:gap-4">
              <span>Live</span>
              <span className="text-primary flex items-center gap-4">
                Sports
                <Trophy className="w-12 h-12 md:w-20 md:h-20" />
              </span>
            </h1>
            <p className="text-zinc-500 max-w-2xl mt-4 font-medium uppercase tracking-widest text-[10px] md:text-xs">
              Experience the thrill of every match in high definition.
            </p>
        </header>

        <div className="space-y-12">
          <LiveSports />
        </div>
      </div>
    </div>
  );
}
