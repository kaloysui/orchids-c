import { getCollectionDetails, getImageUrl } from "@/lib/tmdb";
import Link from "next/link";
import Image from "next/image";
import { Library, Layers, ChevronRight } from "lucide-react";

const POPULAR_COLLECTIONS = [
  86311, // MCU
  10,    // Star Wars
  1241,  // Harry Potter
  645,   // James Bond
  119,   // Lord of the Rings
  531241, // Spider-Man
  328,   // Jurassic Park
  9485,  // Fast & Furious
  87359, // Mission: Impossible
  10194, // Toy Story
  295,   // Pirates of the Caribbean
  403374, // John Wick
  8650,  // Transformers
  157463, // Despicable Me
  263,   // Batman
  84,    // Indiana Jones
  2157,  // Shrek
  8354,  // Ice Age
  43563, // Kung Fu Panda
  161223, // How to Train Your Dragon
];

export default async function CollectionsPage() {
  const collections = await Promise.all(
    POPULAR_COLLECTIONS.map(async (id) => {
      try {
        return await getCollectionDetails(id);
      } catch (e) {
        return null;
      }
    })
  );

  const validCollections = collections.filter((c) => c !== null);

  return (
    <main className="min-h-screen bg-background text-foreground pt-32 pb-20 px-6 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
              <Library className="w-3 h-3" />
              Curated Universes
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase leading-none">
              The <span className="text-primary">Vault</span>
            </h1>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              Legendary cinematic collections, sagas, and universes.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {validCollections.length} Universes
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
          {validCollections.map((collection) => {
            const posters = collection.parts
              ?.slice(0, 3)
              .map((p: any) => getImageUrl(p.poster_path));
            
            return (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="group relative flex flex-col gap-6"
              >
                {/* Stacked Cards Effect */}
                <div className="relative h-[280px] w-full flex items-center justify-center">
                  {/* Third Layer */}
                  <div className="absolute w-[160px] aspect-[2/3] rounded-lg overflow-hidden shadow-2xl transition-all duration-700 group-hover:duration-500 border border-border opacity-40 group-hover:opacity-60 -translate-x-8 rotate-[-12deg] group-hover:-translate-x-12 group-hover:rotate-[-18deg] group-hover:-translate-y-2 bg-card">
                    {posters?.[2] && (
                      <Image
                        src={posters[2]}
                        alt=""
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all"
                      />
                    )}
                  </div>

                  {/* Second Layer */}
                  <div className="absolute w-[160px] aspect-[2/3] rounded-lg overflow-hidden shadow-2xl transition-all duration-700 group-hover:duration-500 border border-border opacity-60 group-hover:opacity-80 translate-x-8 rotate-[12deg] group-hover:translate-x-12 group-hover:rotate-[18deg] group-hover:-translate-y-2 bg-card">
                    {posters?.[1] && (
                      <Image
                        src={posters[1]}
                        alt=""
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all"
                      />
                    )}
                  </div>

                  {/* Main Top Card */}
                  <div className="absolute w-[180px] aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-4 border border-border z-10 bg-card">
                    <Image
                      src={getImageUrl(collection.poster_path)}
                      alt={collection.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-700 -z-10" />
                </div>

                {/* Content */}
                <div className="relative space-y-2 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Layers className="w-3 h-3 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
                      {collection.parts?.length || 0} Entries
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
                    {collection.name}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
