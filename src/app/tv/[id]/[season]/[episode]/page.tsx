import { getMediaDetails, getMediaCredits } from "@/lib/tmdb";
import { TVContent } from "@/components/details/TVContent";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string; season: string; episode: string }> 
}): Promise<Metadata> {
  const { id, season, episode } = await params;
  try {
    const tv = await getMediaDetails("tv", parseInt(id));
    return {
      title: `${tv.name} - S${season} E${episode} - bCine`,
      description: tv.overview,
    };
  } catch (error) {
    return {
      title: "TV Show Not Found - bCine",
    };
  }
}

export default async function TVEpisodePage({ 
  params 
}: { 
  params: Promise<{ id: string; season: string; episode: string }> 
}) {
  const { id, season, episode } = await params;
  
  try {
    const [tv, cast] = await Promise.all([
      getMediaDetails("tv", parseInt(id)),
      getMediaCredits("tv", parseInt(id))
    ]);

    return (
      <TVContent 
        tv={tv} 
        cast={cast} 
        initialSeason={parseInt(season)} 
        initialEpisode={parseInt(episode)} 
      />
    );
  } catch (error) {
    console.error("Error loading TV show details:", error);
    notFound();
  }
}
