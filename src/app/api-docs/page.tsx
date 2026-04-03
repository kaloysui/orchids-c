"use client";

import { useState } from "react";
import { Copy, Check, Film, Tv, Play, RefreshCw } from "lucide-react";

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}

function CopyBtn({ text }: { text: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBox({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/8 bg-[#0d0d0d]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/[0.02]">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">{lang}</span>
        <CopyBtn text={code} />
      </div>
      <pre className="px-4 py-4 text-[13px] text-zinc-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function EndpointBadge({ path }: { path: string }) {
  return (
    <div className="flex items-center gap-3 bg-[#0d0d0d] border border-white/8 rounded-xl px-4 py-3">
      <span className="text-[11px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/20 rounded-md px-2 py-0.5 shrink-0">
        GET
      </span>
      <code className="text-sm font-mono text-zinc-200 break-all">{path}</code>
    </div>
  );
}

function ParamTable({
  rows,
}: {
  rows: { name: string; required?: boolean; type: string; description: string }[];
}) {
  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/8 bg-white/[0.02]">
            {["Parameter", "Type", "Description"].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} className={i < rows.length - 1 ? "border-b border-white/6" : ""}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-primary">{r.name}</code>
                  {r.required && (
                    <span className="text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded px-1.5 py-0.5 uppercase tracking-wide">
                      required
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <code className="text-xs text-zinc-500 font-mono">{r.type}</code>
              </td>
              <td className="px-4 py-3 text-sm text-zinc-400">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Interactive Demo ──────────────────────────────────────────────────────────

function MovieDemo() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [movieId, setMovieId] = useState("129");
  const [activeId, setActiveId] = useState("129");
  const [key, setKey] = useState(0);

  const src = `${origin}/embed/movie/${activeId}`;
  const snippet = `<iframe\n  src="${origin}/embed/movie/${activeId}"\n  width="100%" height="100%"\n  allowfullscreen\n  allow="autoplay; encrypted-media"\n  style="border:none; aspect-ratio:16/9;"\n></iframe>`;

  const load = () => {
    setActiveId(movieId.trim() || "129");
    setKey((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center bg-[#0d0d0d] border border-white/10 rounded-xl px-4 gap-2 focus-within:border-primary/40 transition-colors">
          <span className="text-zinc-600 text-sm font-mono shrink-0">/embed/movie/</span>
          <input
            value={movieId}
            onChange={(e) => setMovieId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="TMDB Movie ID"
            className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none py-3 w-full font-mono"
          />
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          <Play className="w-4 h-4" />
          Load
        </button>
      </div>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "129", label: "Spirited Away" },
          { id: "238", label: "The Godfather" },
          { id: "550", label: "Fight Club" },
          { id: "157336", label: "Interstellar" },
          { id: "299534", label: "Endgame" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => { setMovieId(m.id); setActiveId(m.id); setKey((k) => k + 1); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              activeId === m.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Iframe preview */}
      <div className="rounded-xl overflow-hidden border border-white/8 bg-black" style={{ aspectRatio: "16/9" }}>
        <iframe
          key={key}
          src={src}
          className="w-full h-full border-none"
          allowFullScreen
          allow="autoplay; encrypted-media"
        />
      </div>

      {/* Code */}
      <CodeBox code={snippet} lang="html" />
    </div>
  );
}

function TVDemo() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [showId, setShowId] = useState("1399");
  const [season, setSeason] = useState("1");
  const [episode, setEpisode] = useState("1");
  const [active, setActive] = useState({ id: "1399", s: "1", e: "1" });
  const [key, setKey] = useState(0);

  const src = `${origin}/embed/tv/${active.id}/${active.s}/${active.e}`;
  const snippet = `<iframe\n  src="${origin}/embed/tv/${active.id}/${active.s}/${active.e}"\n  width="100%" height="100%"\n  allowfullscreen\n  allow="autoplay; encrypted-media"\n  style="border:none; aspect-ratio:16/9;"\n></iframe>`;

  const load = () => {
    setActive({ id: showId.trim() || "1399", s: season.trim() || "1", e: episode.trim() || "1" });
    setKey((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center bg-[#0d0d0d] border border-white/10 rounded-xl px-4 gap-2 focus-within:border-primary/40 transition-colors">
          <span className="text-zinc-600 text-sm font-mono shrink-0">/embed/tv/</span>
          <input
            value={showId}
            onChange={(e) => setShowId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="TV Show ID"
            className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none py-3 w-full font-mono"
          />
        </div>
        <div className="flex items-center bg-[#0d0d0d] border border-white/10 rounded-xl px-4 gap-2 w-24 focus-within:border-primary/40 transition-colors">
          <span className="text-zinc-600 text-xs font-mono shrink-0">S</span>
          <input
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="1"
            className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none py-3 w-full font-mono"
          />
        </div>
        <div className="flex items-center bg-[#0d0d0d] border border-white/10 rounded-xl px-4 gap-2 w-24 focus-within:border-primary/40 transition-colors">
          <span className="text-zinc-600 text-xs font-mono shrink-0">E</span>
          <input
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="1"
            className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none py-3 w-full font-mono"
          />
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          <Play className="w-4 h-4" />
          Load
        </button>
      </div>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "1399", s: "1", e: "1", label: "Game of Thrones" },
          { id: "1396", s: "1", e: "1", label: "Breaking Bad" },
          { id: "66732", s: "1", e: "1", label: "Stranger Things" },
          { id: "94997", s: "1", e: "1", label: "House of the Dragon" },
          { id: "84958", s: "1", e: "1", label: "Loki" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setShowId(t.id); setSeason(t.s); setEpisode(t.e);
              setActive({ id: t.id, s: t.s, e: t.e });
              setKey((k) => k + 1);
            }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              active.id === t.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Iframe preview */}
      <div className="rounded-xl overflow-hidden border border-white/8 bg-black" style={{ aspectRatio: "16/9" }}>
        <iframe
          key={key}
          src={src}
          className="w-full h-full border-none"
          allowFullScreen
          allow="autoplay; encrypted-media"
        />
      </div>

      {/* Code */}
      <CodeBox code={snippet} lang="html" />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const [tab, setTab] = useState<"movie" | "tv">("movie");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20 space-y-14">

        {/* ── Header ── */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight">Embed API</h1>
          <p className="text-zinc-500 text-base">
            Embed the player on any website using a simple <code className="text-zinc-300 bg-white/5 px-1.5 py-0.5 rounded-md text-sm">&lt;iframe&gt;</code>.
            Just swap in the TMDB ID and you're good.
          </p>
        </div>

        {/* ── Live Demo ── */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Live Demo</h2>
            <div className="flex items-center bg-white/5 border border-white/8 rounded-xl p-1 gap-1">
              <button
                onClick={() => setTab("movie")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === "movie"
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Film className="w-4 h-4" />
                Movie
              </button>
              <button
                onClick={() => setTab("tv")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === "tv"
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Tv className="w-4 h-4" />
                TV Show
              </button>
            </div>
          </div>

          {tab === "movie" ? <MovieDemo /> : <TVDemo />}
        </section>

        {/* ── Movie Endpoint ── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Film className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Movie</h2>
          </div>

          <EndpointBadge path="/embed/movie/[id]" />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Path Parameters</p>
            <ParamTable
              rows={[
                { name: "id", required: true, type: "number", description: "TMDB Movie ID — find it in the URL on themoviedb.org" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Query Parameters</p>
            <ParamTable
              rows={[
                { name: "color", type: "string", description: 'Accent color as hex without # — e.g. "3b82f6" or "ef4444"' },
                { name: "autoplay", type: "0 | 1", description: "Set to 0 to disable autoplay. Defaults to 1." },
              ]}
            />
          </div>

          <CodeBox
            lang="html"
            code={`<!-- Spirited Away -->
<iframe
  src="${origin}/embed/movie/129"
  width="100%" height="100%"
  allowfullscreen
  allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>

<!-- Custom accent color, no autoplay -->
<iframe
  src="${origin}/embed/movie/129?color=ef4444&autoplay=0"
  width="100%" height="100%"
  allowfullscreen
  allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>`}
          />
        </section>

        {/* ── TV Endpoint ── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Tv className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold">TV Show</h2>
          </div>

          <EndpointBadge path="/embed/tv/[id]/[season]/[episode]" />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Path Parameters</p>
            <ParamTable
              rows={[
                { name: "id", required: true, type: "number", description: "TMDB TV Show ID" },
                { name: "season", required: true, type: "number", description: "Season number starting from 1" },
                { name: "episode", required: true, type: "number", description: "Episode number starting from 1" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Query Parameters</p>
            <ParamTable
              rows={[
                { name: "color", type: "string", description: 'Accent color as hex without # — e.g. "8b5cf6"' },
                { name: "autoplay", type: "0 | 1", description: "Set to 0 to disable autoplay. Defaults to 1." },
              ]}
            />
          </div>

          <CodeBox
            lang="html"
            code={`<!-- Game of Thrones S1E1 -->
<iframe
  src="${origin}/embed/tv/1399/1/1"
  width="100%" height="100%"
  allowfullscreen
  allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>

<!-- With purple accent -->
<iframe
  src="${origin}/embed/tv/1399/1/1?color=8b5cf6"
  width="100%" height="100%"
  allowfullscreen
  allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>`}
          />
        </section>

        {/* ── React snippet ── */}
        <section className="space-y-5">
          <h2 className="text-lg font-bold">React</h2>
          <CodeBox
            lang="tsx"
            code={`function EmbedPlayer({
  type, id, season = 1, episode = 1, color,
}: {
  type: 'movie' | 'tv';
  id: number;
  season?: number;
  episode?: number;
  color?: string;
}) {
  const base = '${origin}';
  const src = type === 'movie'
    ? \`\${base}/embed/movie/\${id}\${color ? \`?color=\${color}\` : ''}\`
    : \`\${base}/embed/tv/\${id}/\${season}/\${episode}\${color ? \`?color=\${color}\` : ''}\`;

  return (
    <div style={{ position: 'relative', paddingTop: '56.25%' }}>
      <iframe
        src={src}
        allowFullScreen
        allow="autoplay; encrypted-media"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}

// Usage
<EmbedPlayer type="movie" id={129} color="3b82f6" />
<EmbedPlayer type="tv" id={1399} season={1} episode={1} />`}
          />
        </section>

        {/* ── Notes ── */}
        <section className="rounded-xl border border-white/8 bg-white/[0.02] px-6 py-5 space-y-3">
          <p className="text-sm font-semibold text-zinc-300">Notes</p>
          <ul className="space-y-2 text-sm text-zinc-500">
            <li className="flex gap-2">
              <span className="text-zinc-600 shrink-0">—</span>
              TMDB IDs are in the URL of any title on <span className="text-zinc-400 font-mono">themoviedb.org</span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-600 shrink-0">—</span>
              <code className="text-zinc-400">color</code> accepts hex without the <code className="text-zinc-400">#</code> prefix
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-600 shrink-0">—</span>
              The embed pages are fullscreen-capable and mobile-responsive
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-600 shrink-0">—</span>
              Use <code className="text-zinc-400">aspect-ratio: 16/9</code> on the iframe container for responsive sizing
            </li>
          </ul>
        </section>

      </div>
    </div>
  );
}
