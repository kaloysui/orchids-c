"use client";

import { MusicProvider, useMusic } from "@/hooks/useMusic";
import { MusicPlayer } from "@/components/music/MusicPlayer";
import { usePathname } from "next/navigation";

function MusicGlobalContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPlayPage = pathname.startsWith("/music/play");

  return (
    <>
      {children}
      {!isPlayPage && <MusicPlayer />}
    </>
  );
}

export function MusicGlobal({ children }: { children: React.ReactNode }) {
  return (
    <MusicProvider>
      <MusicGlobalContent>
        {children}
      </MusicGlobalContent>
    </MusicProvider>
  );
}
