import { Suspense } from "react";
import EmbedMovieClient from "./EmbedMovieClient";

export default async function EmbedMoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center bg-black">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          </div>
        }
      >
        <EmbedMovieClient id={id} />
      </Suspense>
    </div>
  );
}
