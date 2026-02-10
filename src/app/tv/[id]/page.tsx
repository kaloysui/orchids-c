import { getMediaDetails, getMediaCredits } from "@/lib/tmdb";
import { TVContent } from "@/components/details/TVContent";
import { Metadata } from "next";

import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const tv = await getMediaDetails("tv", parseInt(id));
    return {
      title: `${tv.name} - bCine`,
      description: tv.overview,
    };
  } catch (error) {
    return {
      title: "TV Show Not Found - bCine",
    };
  }
}

export default async function TVPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const [tv, cast] = await Promise.all([
      getMediaDetails("tv", parseInt(id)),
      getMediaCredits("tv", parseInt(id))
    ]);

    return <TVContent tv={tv} cast={cast} />;
  } catch (error) {
    console.error("Error loading TV show details:", error);
    notFound();
  }
}
