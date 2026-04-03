"use client";

import { useState } from "react";
import {
  Copy, Check, Film, Tv, Play, ChevronRight,
  Code2, Zap, Globe, BookOpen, Terminal, Hash,
  ArrowRight, Brackets
} from "lucide-react";

// ── Utilities ─────────────────────────────────────────────────────────────────

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}

// ── Components ────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-emerald-400" />
        : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function CodeBox({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#080808]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
          </div>
          <span className="text-[10px] font-semibold text-zinc-700 uppercase tracking-[0.15em]">{lang}</span>
        </div>
        <CopyBtn text={code} />
      </div>
      <div className="overflow-x-auto">
        <pre className="px-5 py-4 text-[12.5px] text-zinc-300 font-mono leading-relaxed whitespace-pre min-w-0">
          {code}
        </pre>
      </div>
    </div>
  );
}

function Badge({ children, color = "sky" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    sky: "text-sky-400 bg-sky-400/10 border-sky-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    rose: "text-rose-400 bg-rose-400/10 border-rose-400/20",
    violet: "text-violet-400 bg-violet-400/10 border-violet-400/20",
    zinc: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  };
  return (
    <span className={`text-[10px] font-bold border rounded-md px-2 py-0.5 shrink-0 tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
}

function EndpointBlock({ method = "GET", path }: { method?: string; path: string }) {
  return (
    <div className="flex items-center gap-3 bg-[#080808] border border-white/[0.06] rounded-2xl px-5 py-4 overflow-x-auto">
      <Badge color="sky">{method}</Badge>
      <code className="text-sm font-mono text-zinc-200 whitespace-nowrap">{path}</code>
    </div>
  );
}

function ParamRow({ name, required, type, description }: {
  name: string; required?: boolean; type: string; description: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[140px_80px_1fr] gap-1 sm:gap-4 py-4 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <code className="text-sm font-mono text-primary truncate">{name}</code>
        {required && <Badge color="rose">req</Badge>}
      </div>
      <code className="text-xs text-zinc-600 font-mono self-start pt-0.5">{type}</code>
      <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}

function ParamTable({ title, rows }: {
  title: string;
  rows: { name: string; required?: boolean; type: string; description: string }[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.15em]">{title}</p>
      <div className="rounded-2xl border border-white/[0.06] bg-[#080808] px-5">
        {rows.map((r) => <ParamRow key={r.name} {...r} />)}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, color = "primary" }: {
  icon: React.ElementType; title: string; subtitle?: string; color?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-zinc-600 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-white/[0.04]" />;
}

// ── Interactive Demo ───────────────────────────────────────────────────────────

function MovieDemo() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [movieId, setMovieId] = useState("129");
  const [activeId, setActiveId] = useState("129");
  const [key, setKey] = useState(0);

  const src = `${origin}/embed/movie/${activeId}`;
  const snippet = `<iframe\n  src="${origin}/embed/movie/${activeId}"\n  width="100%" height="100%"\n  allowfullscreen\n  allow="autoplay; encrypted-media"\n  style="border:none; aspect-ratio:16/9;"\n></iframe>`;

  const load = () => { setActiveId(movieId.trim() || "129"); setKey((k) => k + 1); };

  const picks = [
    { id: "129", label: "Spirited Away" },
    { id: "238", label: "The Godfather" },
    { id: "550", label: "Fight Club" },
    { id: "157336", label: "Interstellar" },
    { id: "299534", label: "Endgame" },
  ];

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center bg-[#080808] border border-white/[0.06] rounded-xl px-4 gap-2 focus-within:border-primary/30 transition-colors min-w-0">
          <span className="text-zinc-700 text-sm font-mono shrink-0 hidden sm:block">/embed/movie/</span>
          <input
            value={movieId}
            onChange={(e) => setMovieId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="TMDB ID"
            className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 outline-none py-3 w-full font-mono min-w-0"
          />
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Load</span>
        </button>
      </div>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-2">
        {picks.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMovieId(m.id); setActiveId(m.id); setKey((k) => k + 1); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              activeId === m.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-white/[0.06] text-zinc-600 hover:border-white/20 hover:text-zinc-300"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Player */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-black w-full" style={{ aspectRatio: "16/9" }}>
        <iframe key={key} src={src} className="w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media" />
      </div>

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

  const picks = [
    { id: "1399", s: "1", e: "1", label: "Game of Thrones" },
    { id: "1396", s: "1", e: "1", label: "Breaking Bad" },
    { id: "66732", s: "1", e: "1", label: "Stranger Things" },
    { id: "94997", s: "1", e: "1", label: "House of Dragon" },
    { id: "84958", s: "1", e: "1", label: "Loki" },
  ];

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[120px] flex items-center bg-[#080808] border border-white/[0.06] rounded-xl px-4 gap-2 focus-within:border-primary/30 transition-colors">
          <span className="text-zinc-700 text-xs font-mono shrink-0 hidden sm:block">/embed/tv/</span>
          <input value={showId} onChange={(e) => setShowId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="TV ID" className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 outline-none py-3 w-full font-mono" />
        </div>
        <div className="flex items-center bg-[#080808] border border-white/[0.06] rounded-xl px-3 gap-1.5 w-16 focus-within:border-primary/30 transition-colors">
          <span className="text-zinc-700 text-xs font-mono shrink-0">S</span>
          <input value={season} onChange={(e) => setSeason(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="1" className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 outline-none py-3 w-full font-mono" />
        </div>
        <div className="flex items-center bg-[#080808] border border-white/[0.06] rounded-xl px-3 gap-1.5 w-16 focus-within:border-primary/30 transition-colors">
          <span className="text-zinc-700 text-xs font-mono shrink-0">E</span>
          <input value={episode} onChange={(e) => setEpisode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="1" className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 outline-none py-3 w-full font-mono" />
        </div>
        <button onClick={load} className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shrink-0">
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Load</span>
        </button>
      </div>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-2">
        {picks.map((t) => (
          <button
            key={t.id}
            onClick={() => { setShowId(t.id); setSeason(t.s); setEpisode(t.e); setActive({ id: t.id, s: t.s, e: t.e }); setKey((k) => k + 1); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              active.id === t.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-white/[0.06] text-zinc-600 hover:border-white/20 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Player */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-black w-full" style={{ aspectRatio: "16/9" }}>
        <iframe key={key} src={src} className="w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media" />
      </div>

      <CodeBox code={snippet} lang="html" />
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

const NAV = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "demo", label: "Live Demo", icon: Zap },
  { id: "movie", label: "Movie Embed", icon: Film },
  { id: "tv", label: "TV Embed", icon: Tv },
  { id: "react", label: "React Usage", icon: Code2 },
  { id: "notes", label: "Notes", icon: Terminal },
];

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const [tab, setTab] = useState<"movie" | "tv">("movie");
  const [activeSection, setActiveSection] = useState("overview");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed top-16 left-0 h-[calc(100vh-4rem)] w-56 border-r border-white/[0.05] bg-[#060606] py-8 z-30">
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center">
              <Brackets className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Embed API</p>
              <p className="text-[10px] text-zinc-700 mt-0.5 font-mono">v1.0</p>
            </div>
          </div>
        </div>

        <div className="px-3 mb-3">
          <p className="text-[10px] font-semibold text-zinc-700 uppercase tracking-[0.15em] px-2 mb-1">Reference</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-all text-left group ${
                activeSection === id
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.03]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {activeSection === id && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </button>
          ))}
        </nav>

        <div className="px-5 pt-5 mx-3 border-t border-white/[0.05]">
          <p className="text-[11px] text-zinc-700 leading-relaxed">
            Uses TMDB IDs. No API key required.
          </p>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 lg:ml-56 min-w-0">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 lg:px-10 pt-10 pb-28 space-y-14">

          {/* ── Overview ── */}
          <section id="overview" className="space-y-8 scroll-mt-6">

            {/* Hero */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3.5 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary tracking-wide">Embed API · v1.0</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Embed Movies &<br />TV Shows Anywhere.
              </h1>
              <p className="text-zinc-500 text-base leading-relaxed">
                Drop a single{" "}
                <code className="text-zinc-300 bg-white/[0.06] px-1.5 py-0.5 rounded-md text-[13px] font-mono">&lt;iframe&gt;</code>
                {" "}into your project and stream any movie or TV episode. Just a TMDB ID — no auth, no keys.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Zap, label: "No auth required" },
                { icon: Globe, label: "CORS-ready" },
                { icon: Film, label: "Movies + TV" },
                { icon: Code2, label: "React component" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-3.5 py-1.5 text-xs text-zinc-500">
                  <Icon className="w-3.5 h-3.5 text-zinc-700" />
                  {label}
                </div>
              ))}
            </div>

            {/* Base URLs */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#080808] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-600 uppercase tracking-[0.15em]">Base URLs</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {[
                  { label: "Movie", path: "/embed/movie/[id]" },
                  { label: "TV Show", path: "/embed/tv/[id]/[season]/[episode]" },
                ].map(({ label, path }) => (
                  <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="text-[11px] font-semibold text-zinc-700 uppercase tracking-widest w-14 shrink-0">{label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-800 shrink-0" />
                    <code className="text-sm font-mono text-zinc-300 overflow-x-auto whitespace-nowrap scrollbar-hide">{origin}{path}</code>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick start */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.15em]">Quick Start</p>
              <CodeBox
                lang="html"
                code={`<iframe
  src="${origin}/embed/movie/129"
  width="100%" height="100%"
  allowfullscreen
  allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>`}
              />
            </div>
          </section>

          <Divider />

          {/* ── Live Demo ── */}
          <section id="demo" className="space-y-6 scroll-mt-6">
            <SectionHeader icon={Zap} title="Live Demo" subtitle="Try any TMDB title right here" />

            {/* Tab switcher */}
            <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 gap-1 w-fit">
              {[
                { key: "movie", label: "Movie", Icon: Film },
                { key: "tv", label: "TV Show", Icon: Tv },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key as "movie" | "tv")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === key
                      ? "bg-white/10 text-white"
                      : "text-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {tab === "movie" ? <MovieDemo /> : <TVDemo />}
          </section>

          <Divider />

          {/* ── Movie Endpoint ── */}
          <section id="movie" className="space-y-6 scroll-mt-6">
            <SectionHeader icon={Film} title="Movie Embed" subtitle="Embed any movie using its TMDB ID" />
            <EndpointBlock path="/embed/movie/[id]" />
            <ParamTable
              title="Path Parameters"
              rows={[
                { name: "id", required: true, type: "number", description: "TMDB Movie ID — find it in the URL on themoviedb.org" },
              ]}
            />
            <ParamTable
              title="Query Parameters"
              rows={[
                { name: "color", type: "string", description: 'Accent color as hex without # — e.g. "3b82f6"' },
                { name: "autoplay", type: "0 | 1", description: "Set to 0 to disable autoplay. Defaults to 1." },
              ]}
            />
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

<!-- Custom accent + no autoplay -->
<iframe
  src="${origin}/embed/movie/129?color=ef4444&autoplay=0"
  width="100%" height="100%"
  allowfullscreen
  allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>`}
            />
          </section>

          <Divider />

          {/* ── TV Endpoint ── */}
          <section id="tv" className="space-y-6 scroll-mt-6">
            <SectionHeader icon={Tv} title="TV Show Embed" subtitle="Stream any episode by show, season, and episode number" />
            <EndpointBlock path="/embed/tv/[id]/[season]/[episode]" />
            <ParamTable
              title="Path Parameters"
              rows={[
                { name: "id", required: true, type: "number", description: "TMDB TV Show ID" },
                { name: "season", required: true, type: "number", description: "Season number starting from 1" },
                { name: "episode", required: true, type: "number", description: "Episode number starting from 1" },
              ]}
            />
            <ParamTable
              title="Query Parameters"
              rows={[
                { name: "color", type: "string", description: 'Accent color as hex without # — e.g. "8b5cf6"' },
                { name: "autoplay", type: "0 | 1", description: "Set to 0 to disable autoplay. Defaults to 1." },
              ]}
            />
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

<!-- With violet accent, no autoplay -->
<iframe
  src="${origin}/embed/tv/1399/1/1?color=8b5cf6&autoplay=0"
  width="100%" height="100%"
  allowfullscreen
  allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>`}
            />
          </section>

          <Divider />

          {/* ── React ── */}
          <section id="react" className="space-y-6 scroll-mt-6">
            <SectionHeader icon={Code2} title="React Usage" subtitle="Drop-in component for React / Next.js apps" />
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
  const q = color ? \`?color=\${color}\` : '';
  const src = type === 'movie'
    ? \`\${base}/embed/movie/\${id}\${q}\`
    : \`\${base}/embed/tv/\${id}/\${season}/\${episode}\${q}\`;

  return (
    <div style={{ position: 'relative', paddingTop: '56.25%' }}>
      <iframe
        src={src}
        allowFullScreen
        allow="autoplay; encrypted-media"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          border: 'none',
        }}
      />
    </div>
  );
}

// Usage
<EmbedPlayer type="movie" id={129} color="3b82f6" />
<EmbedPlayer type="tv" id={1399} season={1} episode={3} />`}
            />
          </section>

          <Divider />

          {/* ── Notes ── */}
          <section id="notes" className="scroll-mt-6">
            <div className="space-y-6">
              <SectionHeader icon={Terminal} title="Notes" subtitle="Things to keep in mind" />
              <div className="rounded-2xl border border-white/[0.06] bg-[#080808] overflow-hidden divide-y divide-white/[0.04]">
                {[
                  <>TMDB IDs are in the URL of any title on <code className="text-zinc-400 font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">themoviedb.org</code></>,
                  <><code className="text-zinc-400 font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">color</code> accepts hex <strong className="font-semibold text-zinc-400">without</strong> the <code className="text-zinc-400 font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">#</code> prefix</>,
                  <>Embed pages are fullscreen-capable and fully mobile-responsive</>,
                  <>Use <code className="text-zinc-400 font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">aspect-ratio: 16/9</code> on the container for responsive sizing</>,
                ].map((content, i) => (
                  <div key={i} className="flex items-start gap-4 px-6 py-4">
                    <span className="text-zinc-800 shrink-0 font-mono text-xs mt-0.5 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-sm text-zinc-500 leading-relaxed">{content}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
