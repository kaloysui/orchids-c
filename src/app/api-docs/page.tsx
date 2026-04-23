"use client";

import { useState, useRef } from "react";
import {
  Copy, Check, Film, Tv, Play, ChevronRight,
  Code2, Zap, Globe, BookOpen, Terminal,
  ArrowRight, Brackets, Home, MonitorPlay, FileText,
  Layers, Sparkles, ExternalLink
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

// ── Shared Components ─────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function CodeBox({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#060606]">
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
        <pre className="px-5 py-4 text-[12.5px] text-zinc-300 font-mono leading-relaxed whitespace-pre min-w-0">{code}</pre>
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
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  };
  return (
    <span className={`text-[10px] font-bold border rounded-md px-2 py-0.5 shrink-0 tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
}

function EndpointBlock({ method = "GET", path }: { method?: string; path: string }) {
  return (
    <div className="flex items-center gap-3 bg-[#060606] border border-white/[0.06] rounded-2xl px-5 py-4 overflow-x-auto">
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
      <div className="rounded-2xl border border-white/[0.06] bg-[#060606] px-5">
        {rows.map((r) => <ParamRow key={r.name} {...r} />)}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: {
  icon: React.ElementType; title: string; subtitle?: string;
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

// ── Demos ─────────────────────────────────────────────────────────────────────

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
        <div className="flex-1 flex items-center bg-[#060606] border border-white/[0.06] rounded-xl px-4 gap-2 focus-within:border-primary/30 transition-colors min-w-0">
          <span className="text-zinc-700 text-sm font-mono shrink-0 hidden sm:block">/embed/movie/</span>
          <input
            value={movieId}
            onChange={(e) => setMovieId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="TMDB ID"
            className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 outline-none py-3 w-full font-mono min-w-0"
          />
        </div>
        <button onClick={load} className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shrink-0">
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Load</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {picks.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMovieId(m.id); setActiveId(m.id); setKey((k) => k + 1); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${activeId === m.id ? "bg-primary/10 border-primary/30 text-primary" : "border-white/[0.06] text-zinc-600 hover:border-white/20 hover:text-zinc-300"}`}
          >
            {m.label}
          </button>
        ))}
      </div>
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
  const load = () => { setActive({ id: showId.trim() || "1399", s: season.trim() || "1", e: episode.trim() || "1" }); setKey((k) => k + 1); };

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
        <div className="flex-1 min-w-[120px] flex items-center bg-[#060606] border border-white/[0.06] rounded-xl px-4 gap-2 focus-within:border-primary/30 transition-colors">
          <span className="text-zinc-700 text-xs font-mono shrink-0 hidden sm:block">/embed/tv/</span>
          <input value={showId} onChange={(e) => setShowId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="TV ID" className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 outline-none py-3 w-full font-mono" />
        </div>
        <div className="flex items-center bg-[#060606] border border-white/[0.06] rounded-xl px-3 gap-1.5 w-16 focus-within:border-primary/30 transition-colors">
          <span className="text-zinc-700 text-xs font-mono shrink-0">S</span>
          <input value={season} onChange={(e) => setSeason(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="1" className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 outline-none py-3 w-full font-mono" />
        </div>
        <div className="flex items-center bg-[#060606] border border-white/[0.06] rounded-xl px-3 gap-1.5 w-16 focus-within:border-primary/30 transition-colors">
          <span className="text-zinc-700 text-xs font-mono shrink-0">E</span>
          <input value={episode} onChange={(e) => setEpisode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="1" className="bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 outline-none py-3 w-full font-mono" />
        </div>
        <button onClick={load} className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shrink-0">
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Load</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {picks.map((t) => (
          <button
            key={t.id}
            onClick={() => { setShowId(t.id); setSeason(t.s); setEpisode(t.e); setActive({ id: t.id, s: t.s, e: t.e }); setKey((k) => k + 1); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${active.id === t.id ? "bg-primary/10 border-primary/30 text-primary" : "border-white/[0.06] text-zinc-600 hover:border-white/20 hover:text-zinc-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-black w-full" style={{ aspectRatio: "16/9" }}>
        <iframe key={key} src={src} className="w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media" />
      </div>
      <CodeBox code={snippet} lang="html" />
    </div>
  );
}

// ── Top Nav ────────────────────────────────────────────────────────────────────

type Page = "home" | "player" | "docs";

function TopNav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "player", label: "Player", icon: MonitorPlay },
    { id: "docs", label: "Docs", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button onClick={() => setPage("home")} className="flex items-center gap-2.5 shrink-0">
          <img src="/favicon.ico" alt="bCine" className="w-7 h-7 rounded-lg object-cover" />
          <span className="text-sm font-black text-white tracking-tight hidden sm:block">EMBED API</span>
        </button>

        {/* Nav pills */}
        <nav className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-full p-1 gap-0.5">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                page === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Version badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-zinc-600">v1.0</span>
        </div>
      </div>
    </header>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────

function HomePage({ setPage }: { setPage: (p: Page) => void }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const features = [
    { icon: Zap, title: "No Auth Required", desc: "Zero API keys, zero sign-up. Just a TMDB ID and you're streaming." },
    { icon: Globe, title: "CORS-Ready", desc: "Embed from any domain. Our player is built to work everywhere." },
    { icon: Layers, title: "Movies & TV", desc: "Full support for movies, TV series with season/episode control." },
    { icon: Code2, title: "React Component", desc: "Drop-in React/Next.js component ready to copy and use instantly." },
    { icon: Sparkles, title: "Custom Theming", desc: "Match your brand with a custom accent color via a single query param." },
    { icon: MonitorPlay, title: "Fullscreen & Mobile", desc: "Fully responsive player with native fullscreen support on all devices." },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-5 pt-20 pb-16 text-center space-y-8">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary tracking-wide">Embed API · v1.0 · Free</span>
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.05]">
              Discover Endless<br />
              <span className="text-primary">Possibilities</span>
            </h1>
            <p className="text-zinc-500 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              Embed any movie or TV show into your website with a single{" "}
              <code className="text-zinc-300 bg-white/[0.06] px-1.5 py-0.5 rounded-md text-sm font-mono">&lt;iframe&gt;</code>.
              No auth, no keys — just TMDB IDs.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setPage("player")}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              <Play className="w-4 h-4 fill-current" />
              Test our player
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage("docs")}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 bg-white/[0.05] border border-white/[0.08] text-zinc-300 rounded-2xl text-sm font-bold hover:bg-white/[0.08] active:scale-[0.98] transition-all"
            >
              <FileText className="w-4 h-4" />
              Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Quick embed preview */}
      <section className="max-w-3xl mx-auto px-5 pb-16 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.15em]">Quick Start</p>
          <button onClick={() => setPage("docs")} className="flex items-center gap-1 text-xs text-primary hover:underline">
            Full docs <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        <CodeBox
          lang="html"
          code={`<!-- Embed a movie -->
<iframe
  src="${origin}/embed/movie/129"
  width="100%" height="100%"
  allowfullscreen allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>

<!-- Embed a TV episode -->
<iframe
  src="${origin}/embed/tv/1399/1/1"
  width="100%" height="100%"
  allowfullscreen allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>`}
        />
      </section>

      {/* Features grid */}
      <section className="max-w-3xl mx-auto px-5 pb-24 space-y-5">
        <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.15em]">Features</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 space-y-3 hover:border-white/[0.10] transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <Icon className="w-4.5 h-4.5 text-primary" style={{ width: "1.125rem", height: "1.125rem" }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-xs text-zinc-600 leading-relaxed mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Player Demo Page ──────────────────────────────────────────────────────────

function PlayerPage({ setPage }: { setPage: (p: Page) => void }) {
  const [tab, setTab] = useState<"movie" | "tv">("movie");

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-5 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MonitorPlay className="w-4.5 h-4.5 text-primary" style={{ width: "1.125rem", height: "1.125rem" }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Live Player Demo</h1>
            <p className="text-xs text-zinc-600">Try any movie or TV show — powered by the embed API</p>
          </div>
        </div>
      </div>

      {/* Type switcher */}
      <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 gap-1 w-fit">
        {[
          { key: "movie" as const, label: "Movie", Icon: Film },
          { key: "tv" as const, label: "TV Show", Icon: Tv },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? "bg-primary text-primary-foreground" : "text-zinc-600 hover:text-zinc-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Demo component */}
      {tab === "movie" ? <MovieDemo /> : <TVDemo />}

      {/* Link to docs */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white">Ready to integrate?</p>
          <p className="text-xs text-zinc-600 mt-0.5">Check the full documentation for all parameters and usage examples.</p>
        </div>
        <button
          onClick={() => setPage("docs")}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shrink-0"
        >
          View Docs <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Docs Page ─────────────────────────────────────────────────────────────────

const DOC_NAV = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "movie", label: "Movie Embed", icon: Film },
  { id: "tv", label: "TV Embed", icon: Tv },
  { id: "react", label: "React Usage", icon: Code2 },
  { id: "notes", label: "Notes", icon: Terminal },
];

function DocsPage({ setPage }: { setPage: (p: Page) => void }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const [activeSection, setActiveSection] = useState("overview");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(`doc-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-56 border-r border-white/[0.05] bg-[#050505] py-8 z-30">
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.ico" alt="bCine" className="w-6 h-6 rounded-md object-cover" />
            <div>
              <p className="text-sm font-bold text-white leading-none">API Reference</p>
              <p className="text-[10px] text-zinc-700 mt-0.5 font-mono">v1.0.0</p>
            </div>
          </div>
        </div>
        <div className="px-3 mb-2">
          <p className="text-[10px] font-semibold text-zinc-700 uppercase tracking-[0.15em] px-2 mb-1">Reference</p>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {DOC_NAV.map(({ id, label, icon: Icon }) => (
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
        <div className="px-5 pt-5 mx-3 border-t border-white/[0.05] space-y-3">
          <p className="text-[11px] text-zinc-700 leading-relaxed">Uses TMDB IDs. No API key required.</p>
          <button
            onClick={() => setPage("player")}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold rounded-xl hover:bg-primary/15 transition-colors"
          >
            <Play className="w-3 h-3 fill-current" /> Try Live Demo
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 lg:ml-56 min-w-0">
        {/* Mobile nav */}
        <div className="lg:hidden sticky top-14 z-20 bg-background/80 backdrop-blur-xl border-b border-white/[0.05] px-5 py-2.5 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {DOC_NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSection === id ? "bg-primary/10 text-primary border border-primary/20" : "text-zinc-600 hover:text-zinc-300"
                }`}
              >
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-10 pb-28 space-y-14">

          {/* ── Overview ── */}
          <section id="doc-overview" className="space-y-8 scroll-mt-6">
            <div className="space-y-5">
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

            {/* Base URLs table */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#060606] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-zinc-600 uppercase tracking-[0.15em]">Endpoints</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {[
                  { label: "Movie", method: "GET", path: "/embed/movie/[id]" },
                  { label: "TV", method: "GET", path: "/embed/tv/[id]/[season]/[episode]" },
                ].map(({ label, method, path }) => (
                  <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                    <Badge color="sky">{method}</Badge>
                    <span className="text-[11px] font-semibold text-zinc-700 uppercase tracking-widest w-10 shrink-0">{label}</span>
                    <code className="text-sm font-mono text-zinc-300 overflow-x-auto whitespace-nowrap">{origin}{path}</code>
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

            {/* Try demo CTA */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">Want to see it in action?</p>
                <p className="text-xs text-zinc-600 mt-0.5">Open the live player demo and test any title right now.</p>
              </div>
              <button
                onClick={() => setPage("player")}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Try Demo
              </button>
            </div>
          </section>

          <Divider />

          {/* ── Movie Endpoint ── */}
          <section id="doc-movie" className="space-y-6 scroll-mt-6">
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
  allowfullscreen allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>

<!-- Custom accent + no autoplay -->
<iframe
  src="${origin}/embed/movie/129?color=ef4444&autoplay=0"
  width="100%" height="100%"
  allowfullscreen allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>`}
            />
          </section>

          <Divider />

          {/* ── TV Endpoint ── */}
          <section id="doc-tv" className="space-y-6 scroll-mt-6">
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
  allowfullscreen allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>

<!-- Violet accent, no autoplay -->
<iframe
  src="${origin}/embed/tv/1399/1/1?color=8b5cf6&autoplay=0"
  width="100%" height="100%"
  allowfullscreen allow="autoplay; encrypted-media"
  style="border:none; aspect-ratio:16/9;"
></iframe>`}
            />
          </section>

          <Divider />

          {/* ── React ── */}
          <section id="doc-react" className="space-y-6 scroll-mt-6">
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

// Usage examples
<EmbedPlayer type="movie" id={129} color="3b82f6" />
<EmbedPlayer type="tv" id={1399} season={1} episode={3} />`}
            />
          </section>

          <Divider />

          {/* ── Notes ── */}
          <section id="doc-notes" className="scroll-mt-6">
            <div className="space-y-6">
              <SectionHeader icon={Terminal} title="Notes" subtitle="Things to keep in mind" />
              <div className="rounded-2xl border border-white/[0.06] bg-[#060606] overflow-hidden divide-y divide-white/[0.04]">
                {[
                  <>TMDB IDs are in the URL of any title on <code className="text-zinc-400 font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">themoviedb.org</code></>,
                  <><code className="text-zinc-400 font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">color</code> accepts hex <strong className="font-semibold text-zinc-400">without</strong> the <code className="text-zinc-400 font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">#</code> prefix</>,
                  <>Embed pages are fullscreen-capable and fully mobile-responsive</>,
                  <>Use <code className="text-zinc-400 font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">aspect-ratio: 16/9</code> on the container for responsive sizing</>,
                  <>No rate limiting — embed as many players as you need on a single page</>,
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

// ── Main App ──────────────────────────────────────────────────────────────────

export default function ApiDocsApp() {
  const [page, setPage] = useState<Page>("home");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav page={page} setPage={setPage} />
      {page === "home" && <HomePage setPage={setPage} />}
      {page === "player" && <PlayerPage setPage={setPage} />}
      {page === "docs" && <DocsPage setPage={setPage} />}
    </div>
  );
}
