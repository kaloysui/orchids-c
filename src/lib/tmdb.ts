const TMDB_API_KEY = "3e20e76d6d210b6cb128d17d233b64dc";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

import https from "https";

// Production-safe fetch for TMDB
async function tmdbFetch(url: string): Promise<Response> {
  // Create a default HTTPS agent to verify TMDB's SSL certificate
  const agent = new https.Agent({
    rejectUnauthorized: true, // normal SSL verification
  });

  const res = await fetch(url, { agent, next: { revalidate: 300 } });
  return res;
}

export async function getTrending() {
  const res = await tmdbFetch(`${BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch trending");
  const data = await res.json();
  return data.results;
}

export async function getTrendingByType(type: "movie" | "tv") {
  const res = await tmdbFetch(`${BASE_URL}/trending/${type}/day?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch trending " + type);
  const data = await res.json();
  return data.results;
}

export async function getTopRatedByType(type: "movie" | "tv") {
  const res = await tmdbFetch(`${BASE_URL}/${type}/top_rated?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch top rated " + type);
  const data = await res.json();
  return data.results;
}

export async function getPopularByType(type: "movie" | "tv") {
  const res = await tmdbFetch(`${BASE_URL}/${type}/popular?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch popular " + type);
  const data = await res.json();
  return data.results;
}

export async function getDiscover(type: "movie" | "tv", options: { providerId?: number; networkId?: number; companyId?: number; page?: number; genreId?: number } = {}) {
  const { providerId, networkId, companyId, page = 1, genreId } = options;
  let url = `${BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=${page}`;
  
  if (providerId) {
    url += `&with_watch_providers=${providerId}&watch_region=US`;
  }
  
  if (networkId && type === 'tv') {
    url += `&with_networks=${networkId}`;
  }

  if (companyId) {
    url += `&with_companies=${companyId}`;
  }

  if (genreId) {
    url += `&with_genres=${genreId}`;
  }
  
  const res = await tmdbFetch(url);
  if (!res.ok) throw new Error(`Failed to fetch discover ${type}`);
  const data = await res.json();
  return {
    results: data.results.map((item: any) => ({ ...item, media_type: type })),
    totalPages: data.total_pages
  };
}

export async function getProviderContent(providerId?: number, networkId?: number, companyId?: number, page: number = 1) {
  const [movieData, tvData] = await Promise.all([
    getDiscover("movie", { providerId, networkId, companyId, page }),
    getDiscover("tv", { providerId, networkId, companyId, page })
  ]);
  
  // Combine and sort by popularity
  const combined = [...movieData.results, ...tvData.results].sort((a, b) => b.popularity - a.popularity);
  return {
    results: combined,
    totalPages: Math.max(movieData.totalPages, tvData.totalPages)
  };
}

export async function getMediaImages(type: "movie" | "tv", id: number) {
  const res = await tmdbFetch(`${BASE_URL}/${type}/${id}/images?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch images");
  const data = await res.json();
  return data;
}

export async function getGenresByType(type: "movie" | "tv") {
  const res = await tmdbFetch(`${BASE_URL}/genre/${type}/list?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error(`Failed to fetch ${type} genres`);
  const data = await res.json();
  return data.genres;
}

export async function getGenres() {
  const [movieGenres, tvGenres] = await Promise.all([
    getGenresByType("movie"),
    getGenresByType("tv")
  ]);
  
  const allGenres = [...movieGenres, ...tvGenres];
  // Filter unique genres by ID
  return Array.from(new Map(allGenres.map(item => [item.id, item])).values());
}

export async function getMediaDetails(type: "movie" | "tv", id: number | string) {
  const res = await tmdbFetch(`${BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`);
  if (!res.ok) throw new Error("Failed to fetch details");
  const data = await res.json();
  return data;
}

export async function getMediaVideos(type: "movie" | "tv", id: number) {
  const res = await tmdbFetch(`${BASE_URL}/${type}/${id}/videos?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch videos");
  const data = await res.json();
  return data.results;
}

export async function getMediaCredits(type: "movie" | "tv", id: number) {
  const res = await tmdbFetch(`${BASE_URL}/${type}/${id}/credits?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch credits");
  const data = await res.json();
  return data.cast;
}

export async function getCollectionDetails(id: number) {
  const res = await tmdbFetch(`${BASE_URL}/collection/${id}?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch collection details");
  const data = await res.json();
  return data;
}

export async function getTVSeasonDetails(id: number, seasonNumber: number) {
  const res = await tmdbFetch(`${BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch season details");
  const data = await res.json();
  return data;
}

export async function getSimilar(type: "movie" | "tv", id: number) {
  const res = await tmdbFetch(`${BASE_URL}/${type}/${id}/similar?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error("Failed to fetch similar content");
  const data = await res.json();
  return data.results;
}

export async function searchMulti(query: string, page: number = 1) {
  const res = await tmdbFetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`);
  if (!res.ok) throw new Error("Failed to search");
  const data = await res.json();
  return data;
}

export function getImageUrl(path: string) {
  if (!path) return "";
  return `${IMAGE_BASE_URL}${path}`;
}
