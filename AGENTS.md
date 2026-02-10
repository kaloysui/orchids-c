## Project Summary
A feature-rich streaming platform with support for Movies, TV Shows, and Music. It integrates multiple video providers and a music streaming API with a focus on high performance and a cinematic user experience.

## Tech Stack
- **Framework**: Next.js (App Router, Edge Runtime)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Database/Auth**: Supabase
- **Video Player**: Custom implementation using HLS.js
- **Music API**: JioSaavn API (for search and playback)

## Architecture
- **src/lib/providers**: Scraper implementations for different video sources (Videasy, bCine, Vidzee)
- **src/lib/scraper.ts**: Master scraper logic with provider prioritization and aggregation
- **src/components/video-player**: Modular video player components with custom controls
- **src/hooks/useMusic.tsx**: Global music state management using React Context

## User Preferences
- **Provider Priority**: Videasy > bCine > Vidzee
- **Music Content**: Preference for Global English Hits (Billboard, Global Top 100) over local indie tracks.

## Project Guidelines
- **Scraper Timeout**: Set to 25 seconds to ensure slow providers have time to respond.
- **Provider Reliability**: Videasy uses parallel server fetches to optimize speed.
- **UI Aesthetics**: Focus on cinematic backgrounds, high-quality typography, and smooth transitions.
- **Flag Icons**: Use a multi-layer fallback strategy (FlagCDN -> FlagsAPI -> Text Fallback) to prevent UI bugs.

## Common Patterns
- **Parallelization**: Critical API calls (like provider scraping) should be parallelized using `Promise.allSettled`.
- **Robust Fetching**: Use `robustFetch` wrapper for external API calls to handle timeouts and retries consistently.
