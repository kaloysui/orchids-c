import { getMediaDetails, getMediaCredits } from "@/lib/tmdb";
import { MovieContent } from "@/components/details/MovieContent";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const movie = await getMediaDetails("movie", parseInt(id));
    return {
      title: `${movie.title} - bCine`,
      description: movie.overview,
    };
  } catch (error) {
    return {
      title: "Movie Not Found - bCine",
    };
  }
}

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const [movie, cast] = await Promise.all([
      getMediaDetails("movie", parseInt(id)),
      getMediaCredits("movie", parseInt(id))
    ]);

    return <MovieContent movie={movie} cast={cast} />;
  } catch (error) {
    console.error("Error loading movie details:", error);
    notFound();
  }
}
