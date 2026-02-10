import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const TMDB_API_KEY = '3e20e76d6d210b6cb128d17d233b64dc';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'movie';
  const page = searchParams.get('page') || '1';

  try {
    const endpoint = type === 'tv' ? 'tv' : 'movie';
    const res = await fetch(
      `${TMDB_BASE_URL}/trending/${endpoint}/week?api_key=${TMDB_API_KEY}&page=${page}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch trending' }, { status: 500 });
    }

    const data = await res.json();
    
    const results = data.results.map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
      year: item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4),
      rating: item.vote_average?.toFixed(1),
      type: type
    }));

    return NextResponse.json({
      results,
      page: data.page,
      totalPages: data.total_pages
    });
  } catch (error) {
    console.error('Trending API error:', error);
    return NextResponse.json({ error: 'Failed to fetch trending' }, { status: 500 });
  }
}
