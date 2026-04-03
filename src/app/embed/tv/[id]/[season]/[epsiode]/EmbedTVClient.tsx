"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const NetPlayer = dynamic(() => import("@/components/netplayer"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
    </div>
  ),
});

interface Props {
  id: string;
  season: number;
  episode: number;
}

export default function EmbedTVClient({ id, season, episode }: Props) {
  const searchParams = useSearchParams();
  const colorParam = searchParams.get("color");
  const autoplayParam = searchParams.get("autoplay");

  const themeColor = colorParam
    ? colorParam.startsWith("#")
      ? colorParam
      : `#${colorParam}`
    : "var(--primary)";

  const autoPlay = autoplayParam !== "0";

  return (
    <div
      className="h-screen w-screen bg-black overflow-hidden"
      style={{ "--primary": themeColor } as React.CSSProperties}
    >
      <NetPlayer
        tvId={id}
        season={season}
        episode={episode}
        autoPlay={autoPlay}
      />
    </div>
  );
}
