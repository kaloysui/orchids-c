"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Play, 
  Film, 
  Tv, 
  Settings, 
  Search, 
  Bookmark, 
  User, 
  LayoutGrid,
  ChevronDown,
  LogOut,
  UserCircle,
  Loader2,
  GalleryVerticalEnd,
  Trophy,
  HardDrive,
    Library,
    Music
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
import { useAuth } from "@/hooks/useAuth";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

const browseItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Music", href: "/music", icon: Music },
  { name: "Movies", href: "/movies", icon: Film },
  { name: "TV Shows", href: "/tv-shows", icon: Tv },
  { name: "Studios", href: "/studios", icon: LayoutGrid },
  { name: "Collections", href: "/collections", icon: Library },
  { name: "Live Sports", href: "/live-sports", icon: Trophy },
  { name: "Genres", href: "#", icon: LayoutGrid, isGenre: true },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
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

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, [user]);

  async function getProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      if (data?.avatar_url) {
        downloadImage(data.avatar_url);
      }
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

  // Hide Navbar on Movie and TV Details pages and Live Sports Player
  const isDetailsPage = pathname.startsWith('/movie/') || pathname.startsWith('/tv/') || pathname.startsWith('/live-sports/play/') || pathname.startsWith('/music/play/');
  
  if (isDetailsPage) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full px-2 md:px-4 py-4 pointer-events-none">
      <nav className="w-full max-w-5xl h-14 md:h-16 flex items-center justify-between relative bg-transparent border-none shadow-none">
        
        {/* Logo and Browse (Separate) */}
        <div className="flex items-center gap-1.5 md:gap-4 pointer-events-auto">
            {/* Logo - No background */}
            <Link 
              href="/" 
              onClick={() => setIsLoading(true)}
              className="transition-all active:scale-95 hover:scale-105"
            >
            <div className="p-0 md:p-1.5">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 md:w-9 md:h-9">
                <path fillRule="evenodd" clipRule="evenodd" d="M16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM9.25 3.75C9.25 4.44036 8.69036 5 8 5C7.30964 5 6.75 4.44036 6.75 3.75C6.75 3.05964 7.30964 2.5 8 2.5C8.69036 2.5 9.25 3.05964 9.25 3.75ZM12 8H9.41901L11.2047 13H9.081L8 9.97321L6.91901 13H4.79528L6.581 8H4V6H12V8Z" className="fill-primary" />
              </svg>
            </div>
          </Link>

          {/* Browse - With background */}
          <div className="bg-card/80 backdrop-blur-xl border border-border shadow-xl rounded-full px-1 py-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-medium text-foreground transition-all outline-none cursor-pointer px-4 py-2 md:py-2.5 rounded-full hover:bg-accent group">
                  <Play className="w-4 h-4 md:w-5 md:h-5 fill-primary text-primary transition-transform group-hover:scale-110" />
                  <span className="hidden sm:inline">Browse</span>
                  <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
                </button>
              </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="start" 
                      sideOffset={12}
                      className="w-[18rem] md:w-[22rem] bg-card/95 border-border text-foreground backdrop-blur-2xl shadow-2xl p-1.5 rounded-2xl animate-in fade-in zoom-in-95 duration-200"
                    >
                      <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                        Menu
                      </div>
                      <div className="grid grid-cols-3 gap-0.5">
                        {browseItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;

                          // ✅ GENRES (modal)
                          if (item.isGenre) {
                            return (
                              <DropdownMenuItem 
                                key={item.name}
                                onSelect={() => setIsGenreModalOpen(true)}
                                className="focus:bg-accent focus:text-accent-foreground cursor-pointer rounded-lg transition-all flex flex-col items-center justify-center text-center py-2 px-1 hover:scale-[0.98] active:scale-95"
                              >
                                <div className="p-1 rounded-lg bg-accent/50 group-hover:bg-accent transition-colors mb-1">
                                  <Icon className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="font-medium text-[10px] leading-tight">{item.name}</span>
                              </DropdownMenuItem>
                            );
                          }

                          // ✅ EXTERNAL LINK (API)
                          if (item.external) {
                            return (
                              <DropdownMenuItem
                                key={item.name}
                                asChild
                                className="focus:bg-accent cursor-pointer rounded-lg"
                              >
                                <a
                                  href={item.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex flex-col items-center justify-center text-center py-2 px-1 hover:scale-[0.98] active:scale-95 transition-all"
                                >
                                  <div className="p-1 rounded-lg bg-accent/50 group-hover:bg-accent transition-colors mb-1">
                                    <Icon className="w-3.5 h-3.5 text-primary" />
                                  </div>
                                  <span className="font-medium text-[10px] leading-tight">{item.name}</span>
                                </a>
                              </DropdownMenuItem>
                            );
                          }

                          // ✅ INTERNAL LINKS (default)
                          return (
                            <DropdownMenuItem
                              key={item.name}
                              asChild
                              className="focus:bg-accent focus:text-accent-foreground cursor-pointer rounded-lg transition-all"
                            >
                              <Link
                                href={item.href}
                                onClick={() => setIsLoading(true)}
                                className={cn(
                                  "flex flex-col items-center justify-center text-center py-2 px-1 hover:scale-[0.98] active:scale-95 transition-all",
                                  isActive && "bg-primary/10 text-primary border border-primary/20"
                                )}
                              >
                                <div className={cn(
                                  "p-1 rounded-lg transition-colors mb-1",
                                  isActive ? "bg-primary/20" : "bg-accent/50"
                                )}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-medium text-[10px] leading-tight">{item.name}</span>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Right Side Items: Individual Search, Watchlist, Profile */}
        <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
            {/* Search */}
            <div className="bg-card/80 backdrop-blur-xl border border-border shadow-xl rounded-full p-1">
              <Link
                href="/search"
                onClick={() => setIsLoading(true)}
                className={cn(
                  "flex items-center justify-center transition-all p-2.5 md:p-3 rounded-full group",
                  pathname === "/search" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                title="Search"
              >
                <Search className="w-5 h-5 transition-transform group-hover:scale-110" />
              </Link>
            </div>

            {/* Watchlist */}
            <div className="bg-card/80 backdrop-blur-xl border border-border shadow-xl rounded-full p-1">
              <Link
                href="/watchlist"
                onClick={() => setIsLoading(true)}
                className={cn(
                  "flex items-center justify-center transition-all p-2.5 md:p-3 rounded-full group",
                  pathname === "/watchlist" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                title="Watchlist"
              >
                <GalleryVerticalEnd className="w-5 h-5 transition-transform group-hover:scale-110" />
              </Link>
            </div>

          {/* Profile */}
          <div className="bg-card/80 backdrop-blur-xl border border-border shadow-xl rounded-full p-1">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center transition-all rounded-full group text-muted-foreground hover:text-foreground hover:bg-accent outline-none overflow-hidden">
                    {avatarUrl ? (
                      <Avatar className="h-full w-full">
                        <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
                        <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                      </Avatar>
                    ) : (
                      <User className="w-5 h-5 transition-transform group-hover:scale-110" />
                    )}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent 
                  align="end" 
                  sideOffset={12}
                  className="w-56 bg-card border-border text-foreground backdrop-blur-2xl shadow-2xl p-2 rounded-2xl animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="focus:bg-accent cursor-pointer rounded-xl">
                    <Link href="/profile" className="flex items-center gap-3 w-full py-2.5 px-2">
                      <UserCircle className="w-4 h-4" />
                      <span className="font-medium">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={handleSignOut}
                    className="focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-xl flex items-center gap-3 w-full py-2.5 px-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => openAuth("login")}
                className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center transition-all rounded-full group text-muted-foreground hover:text-foreground hover:bg-accent outline-none"
                title="Login"
              >
                <User className="w-5 h-5 transition-transform group-hover:scale-110 text-primary" />
              </button>
            )}
          </div>
        </div>

        <GenreModal 
          isOpen={isGenreModalOpen} 
          onClose={() => setIsGenreModalOpen(false)} 
        />
        
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)}
          initialView={authView}
        />
      </nav>
    </div>
  );
}
