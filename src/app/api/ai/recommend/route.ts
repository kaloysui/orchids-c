import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TMDB_API_KEY = "3e20e76d6d210b6cb128d17d233b64dc";
const BASE_URL = "https://api.themoviedb.org/3";

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json();

    // Step 1: Determine intent and search parameters
    const initialCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a movie intent analyzer. Your job is to determine if a user wants recommendations and what parameters to use for TMDB.
          
          TMDB GENRE IDs:
          - Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80, Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36, Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749, Science Fiction: 878, TV Movie: 10770, Thriller: 53, War: 10752, Western: 37

          Return ONLY a JSON object:
          {
            "searchType": "trending" | "genre" | "search" | "top_rated" | "none",
            "genreId": number | null,
            "searchQuery": "string" | null,
            "isRecommendation": boolean
          }`
        },
        ...history.slice(-3).map((msg: any) => ({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        })),
        {
          role: "user",
          content: message,
        }
      ],
      response_format: { type: "json_object" },
    });

    const intentData = JSON.parse(initialCompletion.choices[0].message.content || "{}");
    const { searchType, genreId, searchQuery, isRecommendation } = intentData;

    let results = [];
    if (isRecommendation) {
      if (searchType === "trending") {
        const res = await fetch(`${BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        results = data.results.slice(0, 5);
      } else if (searchType === "genre" && genreId) {
        const res = await fetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`);
        const data = await res.json();
        results = data.results.slice(0, 5);
      } else if (searchType === "search" && searchQuery) {
        const res = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        results = data.results.slice(0, 5);
      } else if (searchType === "top_rated") {
        const res = await fetch(`${BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        results = data.results.slice(0, 5);
      }
    }

    const formattedResults = results.map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      media_type: item.media_type || (item.title ? 'movie' : 'tv'),
      vote_average: item.vote_average
    }));

    // Step 2: Generate the conversational response
    const finalCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are bCine AI, a movie expert. Speak in a cool, friendly way. 
          Use a bit of Cebuano/Tagalog slang if appropriate (G, Tara, Lods, yawa-proof positive vibes).
          
          CRITICAL: When you mention a movie or TV show from the list below, you MUST format it as [[TITLE|TYPE|ID]] so it becomes a link.
          Example: "You should definitely watch [[Inception|movie|27205]]!"
          
          If there are no results, just chat naturally. 
          Don't list them all like a robot. Pick the best ones and describe why they're good.
          
          RESULTS AVAILABLE:
          ${JSON.stringify(formattedResults)}`
        },
        ...history.slice(-5).map((msg: any) => ({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        })),
        {
          role: "user",
          content: message,
        }
      ]
    });

    return NextResponse.json({
      response: finalCompletion.choices[0].message.content,
      results: [] // We don't need the grid anymore as the links are in the text
    });

  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
