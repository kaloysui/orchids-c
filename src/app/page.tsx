import { MovieSpotlight } from "@/components/MovieSpotlight";
import { TopTrendingToday } from "@/components/TopTrendingToday";
import { TopRated } from "@/components/TopRated";
import { WatchNowOn } from "@/components/WatchNowOn";
import { ContinueWatching } from "@/components/ContinueWatching";
import { MostWatched } from "@/components/MostWatched";

export default function Home() {
  return (
    <main className="min-h-screen bg-background pb-32">
      <MovieSpotlight />
      <ContinueWatching />
      
        <MostWatched />
      <TopTrendingToday />
      <WatchNowOn />
      <TopRated />
    </main>
  );
}
