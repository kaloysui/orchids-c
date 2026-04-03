"use client";

import { usePathname } from "next/navigation";

export function EmbedGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEmbed = pathname?.startsWith("/embed");
  if (isEmbed) return null;
  return <>{children}</>;
}
