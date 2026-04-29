"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaDiscord } from "react-icons/fa";
import {
  Home,
  Film,
  Tv,
  Settings,
  Search,
  User,
  LayoutGrid,
  LogOut,
  UserCircle,
  Trophy,
  Library,
  Music,
  Code2,
  Menu,
  X,
  GalleryVerticalEnd,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GenreModal } from "./GenreModal";
import { AuthModal } from "./AuthModal";
import { SearchModal } from "./SearchModal";
import { StudiosModal } from "./StudiosModal";
import { CollectionsModal } from "./CollectionsModal";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

const mainNavItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Movies", href: "/movies", icon: Film },
  { name: "TV Shows", href: "/tv-shows", icon: Tv },
];

const menuModalItems = [
  { name: "Music", href: "/music", icon: Music },
  { name: "Studios", href: "#", icon: LayoutGrid, isStudios: true },
  { name: "Collections", href: "#", icon: Library, isCollections: true },
  { name: "Watchlist", href: "/watchlist", icon: GalleryVerticalEnd },
  { name: "Live Sports", href: "/live-sports", icon: Trophy },
  { name: "Genres", href: "#", icon: LayoutGrid, isGenre: true },
  { name: "API Docs", href: "/api-docs", icon: Code2 },
  {
    name: "Discord",
    href: "https://discord.gg/MTZxF6uVd",
    icon: FaDiscord,
    external: true,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isStudiosOpen, setIsStudiosOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, supabase } = useAuth();
  const { setIsLoading } = useGlobalLoading();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getProfile();
    } else {
      setAvatarUrl(null);
    }
    const handleProfileUpdate = () => {
      if (user) getProfile();
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [user]);

  async function getProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user?.id)
        .single();
      if (error) throw error;
      if (data?.avatar_url) downloadImage(data.avatar_url);
    } catch (error) {
      console.log("Error loading profile avatar", error);
    }
  }

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage.from("avatars").download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.log("Error downloading avatar image", error);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const openAuth = (view: "login" | "register") => {
    setAuthView(view);
    setIsAuthModalOpen(true);
  };

  const isDetailsPage =
    pathname.startsWith("/movie/") ||
    pathname.startsWith("/tv/") ||
    pathname.startsWith("/live-sports/play/") ||
    pathname.startsWith("/music/play/") ||
    pathname.startsWith("/embed/") ||
    pathname === "/api-docs";

  if (isDetailsPage) return null;

  return (
    <>
      {/* Bottom Floating Navbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-5 pointer-events-none">
        <nav className="flex items-center pointer-events-auto bg-neutral-950/85 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl px-2 py-2 gap-0.5">

          {/* Main Nav Items */}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsLoading(true)}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                  isActive
                    ? "text-white bg-white/15"
                    : "text-white/45 hover:text-white/80 hover:bg-white/8"
                )}
                title={item.name}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
              </Link>
            );
          })}

          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 text-white/45 hover:text-white/80 hover:bg-white/8"
            title="Search"
          >
            <Search className="w-5 h-5" strokeWidth={1.8} />
          </button>

          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 text-white/45 hover:text-white/80 hover:bg-white/8"
            title="Menu"
          >
            <Menu className="w-5 h-5" strokeWidth={1.8} />
          </button>

          {/* Divider */}
          <div className="w-px h-7 bg-white/15 mx-1.5 rounded-full" />

          {/* User */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 text-white/45 hover:text-white/80 hover:bg-white/8 outline-none overflow-hidden"
                  title="Profile"
                >
                  {avatarUrl ? (
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <User className="w-5 h-5" strokeWidth={1.8} />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                sideOffset={12}
                className="w-56 bg-neutral-950/95 border-white/10 text-white backdrop-blur-2xl shadow-2xl p-2 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-white/40 truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild className="focus:bg-white/10 cursor-pointer rounded-xl">
                  <Link href="/profile" className="flex items-center gap-3 w-full py-2.5 px-3">
                    <UserCircle className="w-4 h-4 text-white/60" />
                    <span className="font-medium text-sm">Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleSignOut}
                  className="focus:bg-red-500/15 focus:text-red-400 cursor-pointer rounded-xl flex items-center gap-3 w-full py-2.5 px-3"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium text-sm">Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => openAuth("login")}
              className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 text-white/60 hover:text-white hover:bg-white/8 outline-none"
              title="Login"
            >
              <User className="w-5 h-5" strokeWidth={1.8} />
            </button>
          )}

          {/* Settings */}
          <Link
            href="/settings"
            onClick={() => setIsLoading(true)}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
              pathname === "/settings"
                ? "text-white bg-white/15"
                : "text-white/45 hover:text-white/80 hover:bg-white/8"
            )}
            title="Settings"
          >
            <Settings className="w-5 h-5" strokeWidth={1.8} />
          </Link>
        </nav>
      </div>

      {/* Menu Modal */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onClick={() => setIsMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Sheet */}
          <div
            className="relative w-full max-w-md mx-4 mb-24 bg-neutral-950/95 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-semibold text-white/60 tracking-widest uppercase">
                Menu
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of items */}
            <div className="grid grid-cols-4 gap-2 px-4 pb-6 pt-1">
              {menuModalItems.map((item) => {
                const Icon = item.icon;
const isActive =
  !item.isGenre &&
  !item.isStudios &&
  !item.isCollections &&
  !item.external &&
  pathname.startsWith(item.href);

                if (item.isGenre) {
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsGenreModalOpen(true);
                      }}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-200"
                    >
                      <Icon className="w-6 h-6 text-white/60" />
                      <span className="text-[11px] font-medium text-white/50 text-center leading-tight">
                        {item.name}
                      </span>
                    </button>
                  );
                }

                // ✅ STUDIOS
if (item.isStudios) {
  return (
    <button
      key={item.name}
      onClick={() => {
        setIsMenuOpen(false);
        setIsStudiosOpen(true);
      }}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-200"
    >
      <Icon className="w-6 h-6 text-white/60" />
      <span className="text-[11px] font-medium text-white/50 text-center leading-tight">
        {item.name}
      </span>
    </button>
  );
}

// ✅ COLLECTIONS
if (item.isCollections) {
  return (
    <button
      key={item.name}
      onClick={() => {
        setIsMenuOpen(false);
        setIsCollectionsOpen(true);
      }}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-200"
    >
      <Icon className="w-6 h-6 text-white/60" />
      <span className="text-[11px] font-medium text-white/50 text-center leading-tight">
        {item.name}
      </span>
    </button>
  );
}

                if (item.external) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-200"
                    >
                      <Icon className="w-6 h-6 text-white/60" />
                      <span className="text-[11px] font-medium text-white/50 text-center leading-tight">
                        {item.name}
                      </span>
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsLoading(true);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-2 active:scale-95 transition-all duration-200",
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-white/5 hover:bg-white/10 text-white/60"
                    )}
                  >
                    <Icon className={cn("w-6 h-6", isActive ? "text-white" : "text-white/60")} />
                    <span className="text-[11px] font-medium text-center leading-tight">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <GenreModal
        isOpen={isGenreModalOpen}
        onClose={() => setIsGenreModalOpen(false)}
      />

<StudiosModal
  isOpen={isStudiosOpen}
  onClose={() => setIsStudiosOpen(false)}
/>

<CollectionsModal
  isOpen={isCollectionsOpen}
  onClose={() => setIsCollectionsOpen(false)}
/>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={authView}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
