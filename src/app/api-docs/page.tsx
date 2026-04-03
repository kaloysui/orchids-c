"use client";

import { useState } from "react";
import {
  Copy, Check, Film, Tv, Play, ChevronRight,
  Code2, Zap, Globe, BookOpen, Terminal
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
      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-emerald-400" />
        : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBox({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.07] bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
          </div>
          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest ml-2">{lang}</span>
        </div>
        <CopyBtn text={code} />
      </div>
      <pre className="px-5 py-4 text-[13px] text-zinc-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function MethodBadge({ method = "GET" }: { method?: string }) {
  return (
    <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/20 rounded-md px-2 py-0.5 shrink-0 tracking-wider">
      {method}
    </span>
  );
}

function EndpointBadge({ path }: { path: string }) {
  return (
    <div className="flex items-center gap-3 bg-[#0a0a0a] border border-white/[0.07] rounded-xl px-4 py-3.5">
      <MethodBadge />
      <code className="text-sm font-mono text-zinc-200 break-all">{path}</code>
    </div>
  );
}

function ParamRow({ name, required, type, description }: {
  name: string; required?: boolean; type: string; description: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3.5 border-b border-white/[0.05] last:border-0">
      <div className="flex items-center gap-2 sm:w-40 shrink-0">
        <code className="text-sm font-mono text-primary">{name}</code>
        {required && (
          <span className="text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded px-1.5 py-0.5 uppercase tracking-widest">req</span>
        )}
      </div>
      <code className="text-xs text-zinc-600 font-mono sm:w-20 shrink-0 mt-0.5">{type}</code>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

function ParamTable({ title, rows }: {
  title: string;
  rows: { name: string; required?: boolean; type: string; description: string }[];
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">{title}</p>
      <div className="rounded-xl border border-white/[0.07] bg-[#0a0a0a] px-5">
        {rows.map((r) => (
          <ParamRow key={r.name} {...r} />
        ))}
      </div>
    </div>
  );
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
      <div className="flex gap-2">
        <div className="flex-1 flex items-center bg-[#0a0a0a] border border-white/[0.07] rounded-xl px-4 gap-2 focus-within:border-primary/40 transition-colors">
          <span className="text-zinc-700 text-sm font-mono shrink-0">/embed/movie/</span>
          <input
            value={movieId}
            onChange={(e) => setMovieId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="TMDB ID"
            className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 outline-none py-3 w-full font-mono"
          />
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Load
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {picks.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMovieId(m.id); setActiveId(m.id); setKey((k) => k + 1); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              activeId === m.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-white/[0.07] text-zinc-600 hover:border-white/20 hover:text-zinc-300"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden border border-white/[0.07] bg-black" style={{ aspectRatio: "16/9" }}>
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
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[160px] flex items-center bg-[#0a0a0a] border border-white/[0.07] rounded-xl px-4 gap-2 focus-within:border-primary/40 transition-colors">
          <span className="text-zinc-700 text-sm font-mono shrink-0">/embed/tv/</span>
          <input value={showId} onChange={(e) => setShowId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="TV ID" className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 outline-none py-3 w-full font-mono" />
        </div>
        <div className="flex items-center bg-[#0a0a0a] border border-white/[0.07] rounded-xl px-4 gap-2 w-20 focus-within:border-primary/40 transition-colors">
          <span className="text-zinc-700 text-xs font-mono shrink-0">S</span>
          <input value={season} onChange={(e) => setSeason(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="1" className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 outline-none py-3 w-full font-mono" />
        </div>
        <div className="flex items-center bg-[#0a0a0a] border border-white/[0.07] rounded-xl px-4 gap-2 w-20 focus-within:border-primary/40 transition-colors">
          <span className="text-zinc-700 text-xs font-mono shrink-0">E</span>
          <input value={episode} onChange={(e) => setEpisode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="1" className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 outline-none py-3 w-full font-mono" />
        </div>
        <button onClick={load} className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shrink-0">
          <Play className="w-3.5 h-3.5 fill-current" />
          Load
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {picks.map((t) => (
          <button
            key={t.id}
            onClick={() => { setShowId(t.id); setSeason(t.s); setEpisode(t.e); setActive({ id: t.id, s: t.s, e: t.e }); setKey((k) => k + 1); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              active.id === t.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-white/[0.07] text-zinc-600 hover:border-white/20 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden border border-white/[0.07] bg-black" style={{ aspectRatio: "16/9" }}>
        <iframe key={key} src={src} className="w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media" />
      </div>
      <CodeBox code={snippet} lang="html" />
    </div>
  );
}

// ── Sidebar nav items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "demo", label: "Live Demo", icon: Zap },
  { id: "movie", label: "Movie Embed", icon: Film },
  { id: "tv", label: "TV Embed", icon: Tv },
  { id: "react", label: "React Usage", icon: Code2 },
  { id: "notes", label: "Notes", icon: Terminal },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

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
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-60 border-r border-white/[0.06] bg-[#080808] pt-8 pb-8 z-40">
        {/* Logo / title */}
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Embed API</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">v1.0 docs</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                activeSection === id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {activeSection === id && <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 pt-6 border-t border-white/[0.06]">
          <p className="text-[11px] text-zinc-700 leading-relaxed">
            Embed player on any site using a simple <code className="text-zinc-500">&lt;iframe&gt;</code>
          </p>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 lg:ml-60">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 pt-12 pb-24 space-y-16">

          {/* ── Overview ── */}
          <section id="overview" className="space-y-6 scroll-mt-8">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3.5 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary tracking-wide">Embed API</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-white">
                Embed Anything,<br />Anywhere.
              </h1>
              <p className="text-zinc-500 text-base leading-relaxed max-w-lg">
                Drop a single <code className="text-zinc-300 bg-white/[0.06] px-1.5 py-0.5 rounded-md text-sm font-mono">&lt;iframe&gt;</code> into your site and stream movies or TV shows instantly. No keys, no auth, just a TMDB ID.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2.5">
              {[
                { icon: Zap, label: "No auth required" },
                { icon: Globe, label: "Cross-origin ready" },
                { icon: Film, label: "Movies + TV" },
                { icon: Code2, label: "React component" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-full px-3.5 py-1.5 text-xs text-zinc-400">
                  <Icon className="w-3.5 h-3.5 text-zinc-600" />
                  {label}
                </div>
              ))}
            </div>

            {/* Quick start */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Quick Start</span>
                <CopyBtn text={`<iframe src="${origin}/embed/movie/129" width="100%" height="100%" allowfullscreen allow="autoplay; encrypted-media" style="border:none; aspect-ratio:16/9;"></iframe>`} />
              </div>
              <pre className="px-5 py-4 text-[13px] font-mono text-zinc-300 leading-relaxed overflow-x-auto">{`<iframe
  src="${origin}/embed/movie/129"
  width="100%" height="100%"
  allowfullscreen
  allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>`}</pre>
            </div>
          </section>

          {/* ── Live Demo ── */}
          <section id="demo" className="space-y-6 scroll-mt-8">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Live Demo</h2>
              <p className="text-sm text-zinc-500">Try it right here — load any title by TMDB ID.</p>
            </div>

            {/* Tab switcher */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 gap-1 w-fit">
              {[
                { key: "movie", label: "Movie", Icon: Film },
                { key: "tv", label: "TV Show", Icon: Tv },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key as "movie" | "tv")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === key
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {tab === "movie" ? <MovieDemo /> : <TVDemo />}
          </section>

          {/* ── Movie Endpoint ── */}
          <section id="movie" className="space-y-6 scroll-mt-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Film className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Movie Embed</h2>
                <p className="text-xs text-zinc-600">Embed any movie using its TMDB ID</p>
              </div>
            </div>

            <EndpointBadge path="/embed/movie/[id]" />

            <ParamTable
              title="Path Parameters"
              rows={[
                { name: "id", required: true, type: "number", description: "TMDB Movie ID — find it in the URL on themoviedb.org" },
              ]}
            />

            <ParamTable
              title="Query Parameters"
              rows={[
                { name: "color", type: "string", description: 'Accent color as hex without # — e.g. "3b82f6" or "ef4444"' },
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

          {/* Divider */}
          <div className="border-t border-white/[0.05]" />

          {/* ── TV Endpoint ── */}
          <section id="tv" className="space-y-6 scroll-mt-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Tv className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">TV Show Embed</h2>
                <p className="text-xs text-zinc-600">Stream any episode by show ID, season, and episode</p>
              </div>
            </div>

            <EndpointBadge path="/embed/tv/[id]/[season]/[episode]" />

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

          {/* Divider */}
          <div className="border-t border-white/[0.05]" />

          {/* ── React ── */}
          <section id="react" className="space-y-6 scroll-mt-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Code2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">React Usage</h2>
                <p className="text-xs text-zinc-600">Drop-in component for React apps</p>
              </div>
            </div>

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
  const params = color ? \`?color=\${color}\` : '';
  const src = type === 'movie'
    ? \`\${base}/embed/movie/\${id}\${params}\`
    : \`\${base}/embed/tv/\${id}/\${season}/\${episode}\${params}\`;

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
<EmbedPlayer type="tv" id={1399} season={1} episode={1} />`}
            />
          </section>

          {/* ── Notes ── */}
          <section id="notes" className="scroll-mt-8">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.07] flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-zinc-500" />
                <p className="text-sm font-semibold text-zinc-300">Notes</p>
              </div>
              <ul className="divide-y divide-white/[0.04]">
                {[
                  { code: false, content: <>TMDB IDs are in the URL of any title on <code className="text-zinc-400 font-mono text-xs">themoviedb.org</code></> },
                  { code: false, content: <><code className="text-zinc-400 font-mono text-xs">color</code> accepts hex <strong className="font-medium text-zinc-400">without</strong> the <code className="text-zinc-400 font-mono text-xs">#</code> prefix</> },
                  { code: false, content: <>Embed pages are fullscreen-capable and fully mobile-responsive</> },
                  { code: false, content: <>Use <code className="text-zinc-400 font-mono text-xs">aspect-ratio: 16/9</code> on the container for responsive sizing</> },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 px-6 py-4">
                    <span className="text-zinc-700 mt-0.5 shrink-0 font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-sm text-zinc-500 leading-relaxed">{item.content}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
