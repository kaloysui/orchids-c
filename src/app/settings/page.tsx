"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2, Palette, Check, RefreshCw, Play, Info, Signal, Smartphone, Download, Share2, PlusSquare, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { useProviderPing } from "@/hooks/useProviderPing";
import { usePWA } from "@/hooks/usePWA";

const themes = [
  { name: "Deep Blue", value: "light", color: "bg-[#1a2342] border-[#2d3a6d]" },
  { name: "Dark", value: "dark", color: "bg-zinc-950 border-zinc-800" },
  { name: "AMOLED", value: "theme-amoled", color: "bg-black border-zinc-800" },
  { name: "Red", value: "theme-red", color: "bg-red-500 border-red-700" },
  { name: "Teal", value: "theme-teal", color: "bg-teal-500 border-teal-700" },
  { name: "Orange", value: "theme-orange", color: "bg-orange-500 border-orange-700" },
  { name: "Violet", value: "theme-violet", color: "bg-violet-500 border-violet-700" },
  { name: "Brown", value: "theme-brown", color: "bg-amber-800 border-amber-900" },
];

const providers = [
  { id: "beech", name: "BCINE", description: "Recommended Auto play/Auto next" },
  { id: "cedar", name: "CEDAR", description: "Recommended ra" },
  { id: "buke", name: "BUKE", description: "Recommended Auto play" },
];

  export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const pings = useProviderPing();
    const { isInstallable, isInstalled, isIOS, installPWA } = usePWA();
    const [mounted, setMounted] = React.useState(false);

    const [autoPlay, setAutoPlay] = React.useState(true);
    const [defaultProvider, setDefaultProvider] = React.useState("beech");
    const [adsEnabled, setAdsEnabled] = React.useState(true);
  
    React.useEffect(() => {
      setMounted(true);
      const savedAutoPlay = localStorage.getItem("player_autoplay") !== "false";
      let savedProvider = localStorage.getItem("player_provider") || "beech";
    const savedAds = localStorage.getItem("ads_enabled") !== "false"; // Default to true
    
    // Migration logic
    if (savedProvider === "videasy") {
      savedProvider = "beech";
    } else if (savedProvider === "vidsrc") {
      savedProvider = "buke";
    }
    
    setAutoPlay(savedAutoPlay);
    setDefaultProvider(savedProvider);
    setAdsEnabled(savedAds);
  }, []);

  const handleAdsToggle = (checked: boolean) => {
    setAdsEnabled(checked);
    localStorage.setItem("ads_enabled", String(checked));
    // Dispatch a custom event to notify the layout to load/unload scripts if needed
    window.dispatchEvent(new Event("ads_toggle"));
  };

    const handleAutoPlayToggle = (checked: boolean) => {
      setAutoPlay(checked);
      localStorage.setItem("player_autoplay", String(checked));
      localStorage.setItem("player_autonext", String(checked)); // Sync autoNext with autoPlay
      
      if (checked) {
        setDefaultProvider("beech");
        localStorage.setItem("player_provider", "beech");
      }
    };

  const handleProviderChange = (id: string) => {
    setDefaultProvider(id);
    localStorage.setItem("player_provider", id);
  };

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (!mounted) return null;

  return (
    <div className="container max-w-4xl mx-auto py-24 px-4 sm:px-6">
      <div className="space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Settings</h1>
          <p className="text-muted-foreground">
            Customize your bCine experience.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Appearance Section */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-md transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Appearance</CardTitle>
                  <CardDescription>Choose a theme that suits your style.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300",
                      theme === t.value 
                        ? "border-primary bg-primary/10 scale-[1.02]" 
                        : "border-border/50 hover:border-muted-foreground/30 hover:bg-muted/30"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-full border-2 shadow-lg transition-transform group-hover:scale-110", t.color)} />
                    <span className="text-[11px] font-semibold tracking-wide uppercase opacity-80">{t.name}</span>
                    {theme === t.value && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Player Settings Section */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-md overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Play className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Streaming Preferences</CardTitle>
                  <CardDescription>Configure how you watch your favorite content.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold">Sources</Label>
                        <p className="text-xs text-muted-foreground">Select the source for your movies and TV shows.</p>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleProviderChange(p.id)}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-xl border transition-all text-left",
                          defaultProvider === p.id 
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                            : "border-border/50 hover:border-border hover:bg-muted/20"
                        )}
                      >
                        <div className={cn(
                          "mt-1 w-4 h-4 rounded-full border flex items-center justify-center",
                          defaultProvider === p.id ? "border-primary" : "border-muted-foreground/30"
                        )}>
                          {defaultProvider === p.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold">{p.name}</p>
                              {pings?.[p.id] !== undefined && (
                                <div className={cn(
                                  "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight",
                                  pings[p.id] === "error" 
                                    ? "bg-destructive/10 text-destructive"
                                    : (pings[p.id] as number) < 300 
                                      ? "bg-emerald-500/10 text-emerald-500"
                                      : (pings[p.id] as number) < 700
                                        ? "bg-orange-500/10 text-orange-500"
                                        : "bg-destructive/10 text-destructive"
                                )}>
                                  <Signal className="w-2.5 h-2.5" />
                                  <span>{pings[p.id] === "error" ? "N/A" : `${pings[p.id]}ms`}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{p.description}</p>
                          </div>

                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-border/40" />

                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/20">
                  <div className="flex gap-4 items-center">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Play className="w-4 h-4 text-primary fill-primary" />
                    </div>
                        <div className="space-y-0.5">
                            <Label className="text-base font-bold">Intelligent Playback</Label>
                            <p className="text-xs text-muted-foreground">Enable auto-play for a seamless experience (BCINE only).</p>
                          </div>
                        </div>
                        <Switch 
                          checked={autoPlay}
                          onCheckedChange={handleAutoPlayToggle}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
      
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/10">
                        <Info className="w-3.5 h-3.5 text-primary" />
                        <p className="text-[10px] text-primary/80 font-medium">
                          Enabling Intelligent Playback automatically switches your provider to BCINE for a seamless experience.
                        </p>
                      </div>

                <div className="pt-4 border-t border-border/40">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <div className="flex gap-4 items-center">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Heart className="w-4 h-4 text-primary fill-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold">Support bCine</Label>
                          <p className="text-xs text-muted-foreground">Enable ad networks to support the developer.</p>
                        </div>
                      </div>
                      <Switch 
                        checked={adsEnabled}
                        onCheckedChange={handleAdsToggle}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground px-4 italic leading-relaxed">
                      By turning this on, you help me pay for the server and buy some snacks. Thank you!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

            {/* App Installation */}
            {!isInstalled && (
              <Card className="border-border/40 bg-card/40 backdrop-blur-md overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">App Installation</CardTitle>
                      <CardDescription>Install bCine for a better experience on your device.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isIOS ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                        <p className="text-sm font-medium">To install on iOS:</p>
                        <ol className="text-xs space-y-2 text-muted-foreground list-decimal list-inside">
                          <li className="flex items-center gap-2">
                             Tap the <Share2 className="w-3.5 h-3.5 inline text-primary" /> Share button in Safari
                          </li>
                          <li className="flex items-center gap-2">
                            Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-primary" /> "Add to Home Screen"
                          </li>
                          <li>Tap "Add" in the top right corner</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-muted/20">
                      <div className="space-y-1 text-center sm:text-left">
                        <p className="text-sm font-bold">Install Web App</p>
                        <p className="text-xs text-muted-foreground">
                          Access bCine directly from your home screen or taskbar.
                        </p>
                      </div>
                      <Button 
                        disabled={!isInstallable}
                        onClick={installPWA}
                        className="rounded-full px-6 h-9 gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {isInstallable ? "Install bCine" : "Check for Support"}
                      </Button>
                    </div>
                  )}
                  
                  {!isInstallable && !isIOS && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border/20">
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground font-medium">
                        If you don't see the install button, your browser might already have it installed or doesn't support PWA prompts. Check your browser menu for "Install App".
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}

          <Card className="border-destructive/20 bg-destructive/5 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 text-destructive">
                <Trash2 className="w-5 h-5" />
                <CardTitle className="text-lg">Danger Zone</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-sm font-bold">Clear All Data</p>
                  <p className="text-xs text-muted-foreground">
                    Reset preferences, history, and cache. This action is permanent.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleClearCache}
                  className="rounded-full px-6 h-9"
                >
                  Reset App
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Version Info */}
          <div className="flex items-center justify-center px-2 text-[10px] text-muted-foreground/30 uppercase tracking-widest font-medium">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-2.5 h-2.5" />
              <span>v1.2.6-stable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
