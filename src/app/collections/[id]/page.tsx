import { getCollectionDetails, getImageUrl } from "@/lib/tmdb";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Calendar, Star, Play, Library, Layers } from "lucide-react";

export default async function CollectionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collectionId = parseInt(id);
  const collection = await getCollectionDetails(collectionId);

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative h-[80vh] w-full overflow-hidden">
        <Image
          src={getImageUrl(collection.backdrop_path)}
          alt={collection.name}
          fill
          className="object-cover opacity-60 scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/40" />
        
        <div className="absolute inset-0 flex flex-col justify-end px-6 md:px-12 pb-16">
          <div className="max-w-6xl mx-auto w-full space-y-8">
            <Link 
              href="/collections"
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-accent/10 border border-border text-sm font-bold text-muted-foreground hover:text-primary hover:border-primary/50 transition-all group backdrop-blur-md w-fit"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Return to Vault
            </Link>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                  <Library className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.4em] text-primary">
                  Legendary Universe
                </span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-foreground tracking-tighter italic uppercase leading-tight">
                {collection.name}
              </h1>
              <div className="flex items-center gap-6 text-muted-foreground font-medium">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  {collection.parts?.length || 0} Entries
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                <span className="text-muted-foreground max-w-2xl leading-relaxed text-lg line-clamp-3">
                  {collection.overview}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12">
          {collection.parts?.sort((a: any, b: any) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime()).map((movie: any) => (
            <Link
              key={movie.id}
              href={`/movie/${movie.id}`}
              className="group flex flex-col gap-4"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-card border border-border shadow-2xl transition-all duration-500 group-hover:scale-[1.05] group-hover:-translate-y-2 group-hover:border-primary/30">
                <Image
                  src={getImageUrl(movie.poster_path)}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-4 rounded-full bg-primary text-primary-foreground transform scale-50 group-hover:scale-100 transition-all duration-500 shadow-[0_0_30px_rgba(var(--primary),0.5)]">
                    <Play className="w-8 h-8 fill-current" />
                  </div>
                </div>

                {movie.vote_average > 0 && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-background/80 backdrop-blur-md rounded-lg flex items-center gap-1.5 border border-border group-hover:border-primary/50 transition-colors">
                    <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                    <span className="text-[11px] font-black text-foreground">
                      {movie.vote_average.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-1.5">
                <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {movie.title}
                </h3>
                {movie.release_date && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                    <span className="w-1 h-1 rounded-full bg-muted" />
                    <span className="text-primary/60">Released</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
