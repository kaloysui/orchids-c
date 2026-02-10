"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import Hls from "hls.js";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RezeIcons } from "./video-player/reze-icons";
import { useWatchParty } from "@/hooks/useWatchParty";

// Types
export interface PlayerServer {
  name: string;
  url: string;
  type?: "hls" | "mp4";
  useProxy?: boolean;
  flag?: string;
}

const ServerFlag = memo(({ flag }: { flag?: string }) => {
  if (!flag) return null;

  return (
    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/40 group-hover:text-white/60 transition-colors">
      {flag}
    </span>
  );
});

export interface PlayerSubtitle {
  id: string;
  name: string;
  src: string;
  language?: string;
}

export interface VideoPlayerProps {
  servers: PlayerServer[];
  title?: string;
  subtitle?: string;
  subtitles?: PlayerSubtitle[];
  poster?: string;
  autoPlay?: boolean;
  className?: string;
  themeColor?: string;
  isLoading?: boolean;
  nextEpisode?: { title?: string; id?: string; season?: number; episode?: number } | null;
  onAutoNext?: () => void;
  onEnded?: () => void;
}

export function VideoPlayer({
    servers,
    title = "Video Player",
    subtitle,
    subtitles = [],
    poster,
    autoPlay = true,
    className,
    themeColor = "#A359EC",
    isLoading = false,
    nextEpisode,
    onAutoNext,
    onEnded,
  }: VideoPlayerProps) {
    // Helper Components
    const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
    const [subtitleText, setSubtitleText] = useState("");
    const [parsedSubtitles, setParsedSubtitles] = useState<any[]>([]);
    const [failedServers, setFailedServers] = useState<Set<number>>(new Set());

  const ControlButton = memo(({ 
    children, 
    onClick, 
    className,
    active = false
  }: { 
    children: React.ReactNode; 
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    active?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-xl transition-all hover:bg-white/10 active:scale-90 text-white flex items-center justify-center",
        active && "bg-white/10",
        className
      )}
    >
      {children}
    </button>
  ));

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

      useEffect(() => {
        const checkIOS = () => {
          const ua = window.navigator.userAgent;
          return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        };
        setIsIOS(checkIOS());

        const handleFullscreenChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
        };

        const handleWebkitFullscreenChange = () => {
          setIsFullscreen((videoRef.current as any)?.webkitDisplayingFullscreen || false);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        
        const video = videoRef.current;
        if (video) {
          video.addEventListener("webkitbeginfullscreen", handleWebkitFullscreenChange);
          video.addEventListener("webkitendfullscreen", handleWebkitFullscreenChange);
          video.addEventListener("webkitfullscreenchange", handleWebkitFullscreenChange);
        }

        return () => {
          document.removeEventListener("fullscreenchange", handleFullscreenChange);
          document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
          if (video) {
            video.removeEventListener("webkitbeginfullscreen", handleWebkitFullscreenChange);
            video.removeEventListener("webkitendfullscreen", handleWebkitFullscreenChange);
            video.removeEventListener("webkitfullscreenchange", handleWebkitFullscreenChange);
          }
        };
      }, []);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isSwitchingSource, setIsSwitchingSource] = useState(false);
    const [currentServerIndex, setCurrentServerIndex] = useState(0);
    const [qualityLevels, setQualityLevels] = useState<any[]>([]);
    const [currentQuality, setCurrentQuality] = useState(-1);
    const [audioTracks, setAudioTracks] = useState<any[]>([]);
    const [currentAudioTrack, setCurrentAudioTrack] = useState(-1);

    // Appearance State
    const [subtitleSize, setSubtitleSize] = useState<"small" | "medium" | "large" | "xlarge">("medium");
    const [subtitleColor, setSubtitleColor] = useState<string>("#FFFFFF");
    const [subtitleFont, setSubtitleFont] = useState<string>("sans-serif");

    // Auto Next State
    const [showAutoNextOverlay, setShowAutoNextOverlay] = useState(false);
    const [autoNextCountdown, setAutoNextCountdown] = useState(10);
    const autoNextTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoNextTriggeredRef = useRef(false);

    useEffect(() => {
      if (showAutoNextOverlay && autoNextCountdown > 0) {
        autoNextTimerRef.current = setTimeout(() => {
          setAutoNextCountdown(prev => prev - 1);
        }, 1000);
      } else if (showAutoNextOverlay && autoNextCountdown === 0) {
        onAutoNext?.();
        setShowAutoNextOverlay(false);
      }
      return () => {
        if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
      };
    }, [showAutoNextOverlay, autoNextCountdown, onAutoNext]);

    useEffect(() => {
      // Reset trigger when source changes
      autoNextTriggeredRef.current = false;
      setShowAutoNextOverlay(false);
      setAutoNextCountdown(10);
    }, [currentServerIndex]);

    useEffect(() => {
      if (!activeSubtitle && subtitles.length > 0) {
      // Priority: English (US), English (SDH), English, any 'en' language
      const englishSub = subtitles.find(s => {
        const name = s.name.toLowerCase();
        const id = s.id.toLowerCase();
        const lang = (s.language || "").toLowerCase();
        
        return name.includes("english (us)") || id.includes("english (us)") || lang === "en-us";
      }) || subtitles.find(s => {
        const name = s.name.toLowerCase();
        const id = s.id.toLowerCase();
        return name.includes("english (sdh)") || id.includes("english (sdh)");
      }) || subtitles.find(s => {
        const name = s.name.toLowerCase();
        const id = s.id.toLowerCase();
        const lang = (s.language || "").toLowerCase();
        
        return name.includes("english") || 
               lang.startsWith("en") ||
               id.includes("english") ||
               id.includes("eng") ||
               id.startsWith("en") ||
               name === "eng";
      });
      
      if (englishSub) {
        setActiveSubtitle(englishSub.id);
      }
    }
  }, [subtitles, activeSubtitle]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<"main" | "quality" | "subtitles" | "servers" | "playback" | "appearance" | "appearance_size" | "appearance_color" | "appearance_font" | "audio" | "watch_party" | "watch_party_create" | "watch_party_join" | "watch_party_active">("main");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Watch Party
  const [wpUsername, setWpUsername] = useState("");
  const [wpJoinCode, setWpJoinCode] = useState("");
  const [wpChatInput, setWpChatInput] = useState("");
  const [wpCopied, setWpCopied] = useState(false);
    const [wpLinkCopied, setWpLinkCopied] = useState(false);
    const [wpUnreadCount, setWpUnreadCount] = useState(0);
    const wpPrevMessageCountRef = useRef(0);
      const chatEndRef = useRef<HTMLDivElement>(null);

  const watchParty = useWatchParty(
    videoRef,
    () => { videoRef.current?.play().catch(() => {}); },
    () => { videoRef.current?.pause(); },
    (time) => { if (videoRef.current) videoRef.current.currentTime = time; },
  );

  // Auto-join watch party from ?wp= URL param
  const wpAutoJoinHandled = useRef(false);
  useEffect(() => {
    if (wpAutoJoinHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const wpCode = params.get("wp");
    if (wpCode) {
      wpAutoJoinHandled.current = true;
      setWpJoinCode(wpCode.toUpperCase());
      setSettingsOpen(true);
      setSettingsView("watch_party_join");
      // Clean up the URL param without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("wp");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [watchParty.messages]);

  // Track unread messages when chat is not visible
  useEffect(() => {
    const currentCount = watchParty.messages.length;
    const isWpChatVisible = settingsOpen && settingsView === "watch_party_active";
    if (isWpChatVisible) {
      setWpUnreadCount(0);
    } else if (currentCount > wpPrevMessageCountRef.current) {
      setWpUnreadCount(prev => prev + (currentCount - wpPrevMessageCountRef.current));
    }
    wpPrevMessageCountRef.current = currentCount;
  }, [watchParty.messages.length, settingsOpen, settingsView]);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentServer = servers?.[currentServerIndex];
    const lastStateRef = useRef({ currentTime: 0, isPlaying: false });

    const handleServerError = useCallback(() => {
      setFailedServers(prev => {
        const next = new Set(prev);
        next.add(currentServerIndex);
        return next;
      });

      // Find next available server
      const nextIndex = servers.findIndex((_, i) => i > currentServerIndex && !failedServers.has(i));
      if (nextIndex !== -1) {
        setIsSwitchingSource(true);
        setCurrentServerIndex(nextIndex);
      } else {
        // Try from beginning if not found after current
        const firstAvailable = servers.findIndex((_, i) => !failedServers.has(i) && i !== currentServerIndex);
        if (firstAvailable !== -1) {
          setIsSwitchingSource(true);
          setCurrentServerIndex(firstAvailable);
        }
      }
    }, [currentServerIndex, servers, failedServers]);

  const detectType = useCallback((url: string): "hls" | "mp4" => {
    if (url.includes(".m3u8")) return "hls";
    return "mp4";
  }, []);

  const startControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !settingsOpen) setShowControls(false);
    }, 5000);
  }, [isPlaying, settingsOpen]);

  useEffect(() => {
    startControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [startControlsTimer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentServer) return;

    const type = currentServer.type || detectType(currentServer.url);
    const wasPlaying = lastStateRef.current.isPlaying;
    const savedTime = lastStateRef.current.currentTime;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const initVideo = () => {
      setIsSwitchingSource(false);
      if (savedTime > 0) video.currentTime = savedTime;
      if (wasPlaying || autoPlay) {
        video.play().catch(() => {});
      }
    };

    if (type === "hls") {
      if (Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: true,
        });
        hlsRef.current = hls;
        hls.loadSource(currentServer.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setQualityLevels(hls.levels);
          setCurrentQuality(hls.currentLevel);
          setAudioTracks(hls.audioTracks);
          setCurrentAudioTrack(hls.audioTrack);
          initVideo();
        });
          hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
            setCurrentQuality(data.level);
          });
          hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
            setAudioTracks(data.audioTracks);
          });
          hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
            setCurrentAudioTrack(data.id);
          });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal || data.response?.code === 403 || data.response?.code === 404) {
                handleServerError();
              }
            });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = currentServer.url;
        video.onloadedmetadata = initVideo;
        video.onerror = handleServerError;
      }
      } else {
        video.src = currentServer.url;
        video.onloadedmetadata = initVideo;
        video.onerror = handleServerError;
      }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentServer, autoPlay, handleServerError]);

  // Convert SRT text to VTT blob URL for native <track> elements (iOS fullscreen)
  const srtToVttBlobUrl = useCallback((srt: string): string => {
    const vtt = "WEBVTT\n\n" + srt.trim().replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
    const blob = new Blob([vtt], { type: "text/vtt" });
    return URL.createObjectURL(blob);
  }, []);

  const parseSRT = useCallback((srt: string) => {
      const lines = srt.trim().split(/\r?\n\r?\n/);
      const result: any[] = [];
      
      for (const block of lines) {
        const parts = block.split(/\r?\n/);
        if (parts.length >= 3) {
          const timeMatch = parts[1].match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
          if (timeMatch) {
            const startTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
            const endTime = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000;
            const text = parts.slice(2).join("\n").replace(/<[^>]+>/g, "");
            result.push({ startTime, endTime, text });
          }
        }
      }
      return result;
    }, []);

  // Native <track> VTT blob URLs for iOS fullscreen subtitle support
  const [nativeTrackUrls, setNativeTrackUrls] = useState<Record<string, string>>({});

  // Fetch and create VTT blob URLs for all subtitles (for native <track> on iOS)
  useEffect(() => {
    if (!subtitles.length) return;
    let cancelled = false;
    const urls: Record<string, string> = {};

    async function loadTracks() {
      // Only load the active subtitle's track (or first English) to save memory
      const subsToLoad = activeSubtitle
        ? subtitles.filter(s => s.id === activeSubtitle)
        : [];

      for (const sub of subsToLoad) {
        try {
          const res = await fetch(sub.src);
          if (!res.ok) continue;
          const text = await res.text();
          if (cancelled) return;
          urls[sub.id] = srtToVttBlobUrl(text);
        } catch { /* skip */ }
      }
      if (!cancelled) setNativeTrackUrls(prev => ({ ...prev, ...urls }));
    }

    loadTracks();
    return () => {
      cancelled = true;
      // Revoke old blob URLs
      Object.values(urls).forEach(u => URL.revokeObjectURL(u));
    };
  }, [activeSubtitle, subtitles, srtToVttBlobUrl]);

  // Sync native track mode when activeSubtitle changes (for iOS fullscreen)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      // On iOS native fullscreen, "showing" makes it visible
      // On desktop, we use our custom overlay so keep it "hidden" (still fires cuechange but doesn't render natively)
      if (track.label === activeSubtitle) {
        track.mode = isIOS ? "showing" : "hidden";
      } else {
        track.mode = "disabled";
      }
    }
  }, [activeSubtitle, nativeTrackUrls, isIOS]);

  useEffect(() => {
    if (!activeSubtitle) {
      setParsedSubtitles([]);
      setSubtitleText("");
      return;
    }

    const sub = subtitles.find(s => s.id === activeSubtitle);
    if (!sub) return;

    fetch(sub.src)
      .then(res => res.text())
      .then(text => {
        const parsed = parseSRT(text);
        setParsedSubtitles(parsed);
      })
      .catch(console.error);
  }, [activeSubtitle, subtitles]);

  useEffect(() => {
    if (!parsedSubtitles.length) {
      setSubtitleText("");
      return;
    }

    const current = parsedSubtitles.find(
      s => currentTime >= s.startTime && currentTime <= s.endTime
    );
    setSubtitleText(current?.text || "");
  }, [currentTime, parsedSubtitles]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(time);
      lastStateRef.current.currentTime = time;
      if (videoRef.current.buffered.length > 0) {
        setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
      }

      if (nextEpisode && dur > 0 && !autoNextTriggeredRef.current && !videoRef.current.ended) {
        const remaining = dur - time;
        if (remaining <= 15 && remaining > 0 && !showAutoNextOverlay) {
          setShowAutoNextOverlay(true);
          setAutoNextCountdown(10);
          autoNextTriggeredRef.current = true;
        }
      }
    }
  }, [nextEpisode, showAutoNextOverlay]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    watchParty.sendSeek(newTime);
  }, [duration, watchParty.sendSeek]);

  const skip = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
      watchParty.sendSeek(videoRef.current.currentTime);
    }
  }, [watchParty.sendSeek]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  }, []);

    const toggleFullscreen = useCallback(async () => {
      const video = videoRef.current;
      const container = containerRef.current;
      if (!video || !container) return;

      try {
        if (isIOS && (video as any).webkitEnterFullscreen) {
          (video as any).webkitEnterFullscreen();
          return;
        }

        if (!document.fullscreenElement) {
          if (container.requestFullscreen) {
            await container.requestFullscreen();
          } else if ((container as any).webkitRequestFullscreen) {
            await (container as any).webkitRequestFullscreen();
          } else if ((video as any).webkitEnterFullscreen) {
            (video as any).webkitEnterFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          }
        }
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    }, [isIOS]);

  const handleChromecast = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if ((video as any).remote && (video as any).remote.state !== "unavailable") {
      try {
        await (video as any).remote.prompt();
      } catch (err) {
        console.error("Chromecast error:", err);
      }
    } else if ((video as any).webkitShowPlaybackTargetPicker) {
      (video as any).webkitShowPlaybackTargetPicker();
    } else {
      if (typeof window !== 'undefined' && (window as any).PresentationRequest) {
        try {
          const request = new (window as any).PresentationRequest([currentServer.url]);
          request.start().catch(() => {});
        } catch (err) {
          alert("Casting is not supported in this browser.");
        }
      } else {
        alert("Casting is not supported in this browser.");
      }
    }
  }, [currentServer?.url]);

  const togglePip = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP error:", err);
    }
  }, []);

  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const handleInteraction = useCallback(() => {
    setShowControls(true);
    startControlsTimer();
  }, [startControlsTimer]);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return RezeIcons.VOLUME_X;
    if (volume < 0.33) return RezeIcons.VOLUME_LOW;
    if (volume < 0.66) return RezeIcons.VOLUME_MED;
    return RezeIcons.VOLUME;
  };

  const renderSettingsContent = () => {
    const backButton = (title: string, backTo: typeof settingsView = "main") => (
      <button 
        onClick={() => setSettingsView(backTo)} 
        className="flex items-center gap-3 p-5 border-b border-white/5 hover:bg-white/5 transition-colors w-full text-left"
      >
        <span className="rotate-180 opacity-50 text-xl flex items-center">{RezeIcons.CHEVRON_RIGHT}</span>
        <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-white/50">{title}</span>
      </button>
    );

    const GridItem = ({ label, value, onClick }: { label: string; value: string; onClick: () => void }) => (
      <button
        onClick={onClick}
        className="flex flex-col items-start justify-center bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl py-3 px-4 sm:py-5 sm:px-5 transition-all active:scale-95 border border-white/5 group"
      >
        <span className="text-white/30 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] mb-1 group-hover:text-white/50 transition-colors">{label}</span>
        <span className="text-white text-[13px] sm:text-[15px] font-semibold truncate max-w-full">{value}</span>
      </button>
    );

        const ListItem = ({ label, icon, onClick, showChevron = true, badge }: { label: string; icon?: React.ReactNode; onClick: () => void; showChevron?: boolean; badge?: string }) => (
          <button
            onClick={onClick}
            className="w-full flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4.5 hover:bg-white/5 transition-colors text-left group list-none"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              {icon && <span className="text-white/40 group-hover:text-white transition-colors text-lg sm:text-xl flex items-center">{icon}</span>}
              <span className="text-white/70 text-[14px] sm:text-[15px] font-medium group-hover:text-white transition-colors">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              {badge && (
                <span 
                  className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border"
                  style={{ 
                    color: themeColor, 
                    backgroundColor: `${themeColor}15`,
                    borderColor: `${themeColor}30`
                  }}
                >{badge}</span>
              )}
              {showChevron && <span className="text-white/10 group-hover:text-white/30 transition-colors flex items-center">{RezeIcons.CHEVRON_RIGHT}</span>}
            </div>
          </button>
        );


        const Item = ({ label, onClick, active, statusIcon, flag }: { label: string; onClick: () => void; active?: boolean; statusIcon?: React.ReactNode; flag?: string }) => {
          // Detect badge (e.g. "(1080p)")
          const badgeMatch = label.match(/\(([^)]+)\)$/);
          const cleanLabel = badgeMatch ? label.replace(badgeMatch[0], '').trim() : label;
          const badge = badgeMatch ? badgeMatch[1] : null;

          return (
            <button
              onClick={onClick}
              className={cn(
                "w-full flex items-center justify-between px-6 py-4 transition-all text-left rounded-xl list-none",
                active ? "text-white" : "hover:bg-white/5 text-white/60 hover:text-white"
              )}
              style={active ? { 
                backgroundColor: `color-mix(in srgb, ${themeColor}, transparent 80%)`, 
                border: `1px solid color-mix(in srgb, ${themeColor}, transparent 60%)` 
              } : {}}
            >
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-medium">{cleanLabel}</span>
                {badge && (
                  <span 
                    className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border"
                    style={{ 
                      color: themeColor, 
                      backgroundColor: `color-mix(in srgb, ${themeColor}, transparent 85%)`,
                      borderColor: `color-mix(in srgb, ${themeColor}, transparent 70%)`
                    }}
                  >{badge}</span>
                )}
              </div>
                <div className="flex items-center gap-3">
                  <ServerFlag flag={flag} />
                  <div className="flex items-center justify-center min-w-[24px]">
                    {statusIcon}
                  </div>
                </div>
            </button>
          );
        };


    if (settingsView === "main") {
      return (
        <div className="flex flex-col landscape:flex-row gap-2 sm:gap-3 w-full max-w-[360px] landscape:max-w-[850px] max-h-[92vh] landscape:max-h-[94vh]">
          <div className="flex flex-col gap-2 sm:gap-3 flex-[1.3] min-h-0">
            {/* Volume Control */}
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[1.2rem] sm:rounded-[1.5rem] p-3 sm:p-5 shadow-2xl relative overflow-hidden group/vol-card shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-white/40 group-hover/vol-card:scale-110 transition-transform duration-300">
                      <span className="text-base sm:text-lg flex items-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{getVolumeIcon()}</span>
                    </div>
                    <span className="text-white/40 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">Volume</span>
                  </div>
                  <div className="bg-white/5 px-1.5 py-0.5 rounded-lg border border-white/5 shadow-xl">
                    <span className="text-white font-mono font-black text-[8px] sm:text-[9px] tracking-wider">{Math.round(volume * 100)}%</span>
                  </div>
                </div>
                <div className="relative flex items-center h-3 sm:h-4 group/vol">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 sm:h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer outline-none transition-all group-hover/vol:h-1.5 sm:group-hover/vol:h-2"
                    style={{ 
                      background: `linear-gradient(to right, ${themeColor} 0%, ${themeColor} ${volume * 100}%, rgba(255,255,255,0.05) ${volume * 100}%, rgba(255,255,255,0.05) 100%)`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Main Settings Grid */}
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] sm:rounded-[1.8rem] p-2 sm:p-4 shadow-2xl relative overflow-hidden flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 h-full content-start overflow-y-auto pr-1">
                <GridItem 
                  label="Quality" 
                  value={currentQuality === -1 ? "Auto" : `${qualityLevels[currentQuality]?.height}p`} 
                  onClick={() => setSettingsView("quality")} 
                />
                <GridItem 
                  label="Sources" 
                  value={currentServer?.name || "Default"} 
                  onClick={() => setSettingsView("servers")} 
                />
                <GridItem 
                  label="Captions" 
                  value={activeSubtitle ? subtitles.find(s => s.id === activeSubtitle)?.name || "English" : "Off"} 
                  onClick={() => setSettingsView("subtitles")} 
                />
                <GridItem 
                  label="Speed" 
                  value={playbackSpeed === 1 ? "Normal" : `${playbackSpeed}x`} 
                  onClick={() => setSettingsView("playback")} 
                />
              </div>
            </div>
          </div>

            <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-h-0">
              {/* Secondary Controls */}
              <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] sm:rounded-[1.8rem] p-1.5 sm:p-3 shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-center min-h-0">
                <div className="flex flex-col gap-0.5 -mx-1 overflow-y-auto">
                      <ListItem label="Appearance" icon={RezeIcons.PALETTE} onClick={() => setSettingsView("appearance")} />
                      <ListItem label="Watch Party" icon={RezeIcons.WATCH_PARTY} onClick={() => { 
                    if (watchParty.isActive) {
                      setSettingsView("watch_party_active");
                      setWpUnreadCount(0);
                    } else {
                      setSettingsView("watch_party");
                    }
                  }} badge={watchParty.isActive ? `${watchParty.users.length} Online` : undefined} />
                      <ListItem 
                        label="Audio" 
                        icon={RezeIcons.AUDIO} 
                        onClick={() => setSettingsView("audio")} 
                        badge={audioTracks.length > 1 ? `${audioTracks.length} Tracks` : undefined}
                      />
                    </div>
              </div>


            {/* Close Button */}
            <button
              onClick={() => { setSettingsOpen(false); setSettingsView("main"); }}
              className="w-full py-3 sm:py-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[1.2rem] sm:rounded-[1.5rem] text-white font-black transition-all active:scale-[0.97] shadow-xl text-[9px] sm:text-[11px] uppercase tracking-[0.35em] hover:bg-white/5 shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      );
    }


    if (settingsView === "quality") {
      return (
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {backButton("Quality")}
            <div className="p-3 space-y-1 max-h-[350px] overflow-y-auto">
            <Item label="Auto" onClick={() => { hlsRef.current && (hlsRef.current.currentLevel = -1); setCurrentQuality(-1); setSettingsOpen(false); }} active={currentQuality === -1} />
            {qualityLevels.map((level, i) => (
              <Item key={i} label={`${level.height}p`} onClick={() => { hlsRef.current && (hlsRef.current.currentLevel = i); setCurrentQuality(i); setSettingsOpen(false); }} active={currentQuality === i} />
            ))}
          </div>
        </div>
      );
    }

    if (settingsView === "servers") {
      return (
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {backButton("Sources")}
              <div className="p-3 space-y-1 max-h-[350px] overflow-y-auto">
                {servers.map((server, i) => (
                  <Item 
                    key={i} 
                    label={server.name} 
                    flag={server.flag}
                    onClick={() => { 
                      if (currentServerIndex !== i) {
                        setIsSwitchingSource(true);
                        setCurrentServerIndex(i); 
                      }
                      setSettingsOpen(false); 
                    }} 
                    active={currentServerIndex === i}
                    statusIcon={
                      failedServers.has(i) ? (
                        <span className="text-red-500 text-lg flex items-center">{RezeIcons.ERROR}</span>
                      ) : currentServerIndex === i ? (
                        <span className="text-lg flex items-center" style={{ color: themeColor }}>{RezeIcons.CHECK}</span>
                      ) : null
                    }
                  />
                ))}
            </div>
        </div>
      );
    }

    if (settingsView === "subtitles") {
      return (
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {backButton("Captions")}
            <div className="p-3 space-y-1 max-h-[350px] overflow-y-auto">
              <Item label="Off" onClick={() => { setActiveSubtitle(null); setSettingsOpen(false); }} active={!activeSubtitle} />
              {subtitles.map((sub) => (
                <Item 
                  key={sub.id} 
                  label={sub.name} 
                  onClick={() => { setActiveSubtitle(sub.id); setSettingsOpen(false); }} 
                  active={activeSubtitle === sub.id}
                />
              ))}
            </div>
        </div>
      );
    }

    if (settingsView === "playback") {
      return (
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {backButton("Playback Speed")}
          <div className="p-3 space-y-1">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
              <Item key={speed} label={speed === 1 ? "Normal" : `${speed}x`} onClick={() => { if (videoRef.current) { videoRef.current.playbackRate = speed; setPlaybackSpeed(speed); } setSettingsOpen(false); }} active={playbackSpeed === speed} />
            ))}
          </div>
        </div>
      );
    }

    if (settingsView === "appearance") {
      return (
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {backButton("Appearance")}
          <div className="p-3 space-y-1">
            <ListItem label="Text Size" onClick={() => setSettingsView("appearance_size")} />
            <ListItem label="Text Color" onClick={() => setSettingsView("appearance_color")} />
            <ListItem label="Font Family" onClick={() => setSettingsView("appearance_font")} />
          </div>
        </div>
      );
    }

    if (settingsView === "appearance_size") {
      const sizes: { label: string; value: "small" | "medium" | "large" | "xlarge" }[] = [
        { label: "Small", value: "small" },
        { label: "Medium", value: "medium" },
        { label: "Large", value: "large" },
        { label: "Extra Large", value: "xlarge" },
      ];
      return (
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {backButton("Text Size")}
          <div className="p-3 space-y-1">
            {sizes.map((s) => (
              <Item key={s.value} label={s.label} onClick={() => { setSubtitleSize(s.value); setSettingsView("appearance"); }} active={subtitleSize === s.value} />
            ))}
          </div>
        </div>
      );
    }

    if (settingsView === "appearance_color") {
      const colors = [
        { label: "White", value: "#FFFFFF" },
        { label: "Yellow", value: "#FFFF00" },
        { label: "Cyan", value: "#00FFFF" },
        { label: "Green", value: "#00FF00" },
      ];
      return (
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {backButton("Text Color")}
          <div className="p-3 space-y-1">
            {colors.map((c) => (
              <Item key={c.value} label={c.label} onClick={() => { setSubtitleColor(c.value); setSettingsView("appearance"); }} active={subtitleColor === c.value} />
            ))}
          </div>
        </div>
      );
    }

      if (settingsView === "appearance_font") {
        const fonts = [
          { label: "Sans-serif", value: "sans-serif" },
          { label: "Serif", value: "serif" },
          { label: "Monospace", value: "monospace" },
        ];
        return (
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            {backButton("Font Family")}
            <div className="p-3 space-y-1">
              {fonts.map((f) => (
                <Item key={f.value} label={f.label} onClick={() => { setSubtitleFont(f.value); setSettingsView("appearance"); }} active={subtitleFont === f.value} />
              ))}
            </div>
          </div>
        );
      }

      if (settingsView === "audio") {
        return (
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            {backButton("Audio Tracks")}
            <div className="p-3 space-y-1 max-h-[350px] overflow-y-auto">
              {audioTracks.length > 0 ? (
                audioTracks.map((track) => (
                  <Item 
                    key={track.id} 
                    label={track.name || `Track ${track.id}`} 
                    onClick={() => { 
                      if (hlsRef.current) {
                        hlsRef.current.audioTrack = track.id;
                      }
                      setCurrentAudioTrack(track.id);
                      setSettingsOpen(false); 
                    }} 
                    active={currentAudioTrack === track.id} 
                  />
                ))
              ) : (
                <div className="p-6 text-center text-white/40 text-sm font-medium">
                  Default Audio Track
                </div>
              )}
            </div>
          </div>
        );
      }

      if (settingsView === "watch_party") {
        return (
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl w-full max-w-[360px]">
            {backButton("Watch Party")}
            <div className="p-6 flex flex-col gap-3">
              <button
                onClick={() => setSettingsView("watch_party_create")}
                className="w-full py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.15em] transition-all hover:brightness-110 active:scale-[0.97]"
                style={{ backgroundColor: themeColor, color: '#000', boxShadow: `0 8px 20px -4px color-mix(in srgb, ${themeColor}, transparent 60%)` }}
              >
                Create Room
              </button>
              <button
                onClick={() => setSettingsView("watch_party_join")}
                className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[12px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.97] border border-white/10"
              >
                Join Room
              </button>
            </div>
          </div>
        );
      }

      if (settingsView === "watch_party_create") {
        return (
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl w-full max-w-[360px]">
            {backButton("Create Room", "watch_party")}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Your Name</label>
                <input
                  type="text"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                  placeholder="Enter username..."
                  maxLength={20}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] font-medium placeholder:text-white/20 outline-none focus:border-white/30 transition-colors"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              {watchParty.error && (
                <p className="text-red-400 text-[11px] font-medium">{watchParty.error}</p>
              )}
              <button
                onClick={() => {
                  if (wpUsername.trim()) {
                    watchParty.createRoom(wpUsername.trim());
                    setSettingsView("watch_party_active");
                  }
                }}
                disabled={!wpUsername.trim()}
                className="w-full py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.15em] transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: themeColor, color: '#000', boxShadow: `0 8px 20px -4px color-mix(in srgb, ${themeColor}, transparent 60%)` }}
              >
                Create
              </button>
            </div>
          </div>
        );
      }

      if (settingsView === "watch_party_join") {
        return (
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl w-full max-w-[360px]">
            {backButton("Join Room", "watch_party")}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Your Name</label>
                <input
                  type="text"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                  placeholder="Enter username..."
                  maxLength={20}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] font-medium placeholder:text-white/20 outline-none focus:border-white/30 transition-colors"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Room Code</label>
                <input
                  type="text"
                  value={wpJoinCode}
                  onChange={(e) => setWpJoinCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-[18px] font-black tracking-[0.4em] text-center placeholder:text-white/20 placeholder:tracking-[0.4em] outline-none focus:border-white/30 transition-colors font-mono"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              {watchParty.error && (
                <p className="text-red-400 text-[11px] font-medium">{watchParty.error}</p>
              )}
              <button
                onClick={() => {
                  if (wpUsername.trim() && wpJoinCode.trim().length === 6) {
                    watchParty.joinRoom(wpJoinCode.trim(), wpUsername.trim());
                    setSettingsView("watch_party_active");
                  }
                }}
                disabled={!wpUsername.trim() || wpJoinCode.trim().length !== 6}
                className="w-full py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.15em] transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: themeColor, color: '#000', boxShadow: `0 8px 20px -4px color-mix(in srgb, ${themeColor}, transparent 60%)` }}
              >
                Join
              </button>
            </div>
          </div>
        );
      }

      if (settingsView === "watch_party_active") {
        return (
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl w-full max-w-[400px] flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xl flex items-center" style={{ color: themeColor }}>{RezeIcons.WATCH_PARTY}</span>
                <div className="flex flex-col">
                  <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Room Code</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-[18px] font-black tracking-[0.3em] font-mono">{watchParty.roomCode}</span>
                      <button
                        onClick={() => {
                          if (watchParty.roomCode) {
                            navigator.clipboard.writeText(watchParty.roomCode);
                            setWpCopied(true);
                            setTimeout(() => setWpCopied(false), 2000);
                          }
                        }}
                        className="text-white/30 hover:text-white transition-colors text-sm flex items-center"
                        title="Copy code"
                      >
                        {wpCopied ? RezeIcons.CHECK : RezeIcons.COPY}
                      </button>
                      <button
                        onClick={() => {
                          if (watchParty.roomCode) {
                            const url = new URL(window.location.href);
                            url.searchParams.set("wp", watchParty.roomCode);
                            navigator.clipboard.writeText(url.toString());
                            setWpLinkCopied(true);
                            setTimeout(() => setWpLinkCopied(false), 2000);
                          }
                        }}
                        className="text-white/30 hover:text-white transition-colors text-sm flex items-center"
                        title="Copy invite link"
                      >
                        {wpLinkCopied ? RezeIcons.CHECK : RezeIcons.LINK}
                      </button>
                    </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      watchParty.leaveRoom();
                      setSettingsView("main");
                      setSettingsOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-[0.15em] transition-all border border-red-500/20"
                  >
                    <span className="text-sm flex items-center">{RezeIcons.LEAVE}</span>
                    Leave
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all border border-white/10"
                    title="Close chat"
                  >
                    <span className="text-sm flex items-center">{RezeIcons.CLOSE}</span>
                  </button>
                </div>
            </div>

            {/* Users */}
            <div className="px-5 py-3 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/30 text-sm flex items-center">{RezeIcons.USERS}</span>
                <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">{watchParty.users.length} Online</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchParty.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                    style={user.isHost ? {
                      backgroundColor: `color-mix(in srgb, ${themeColor}, transparent 85%)`,
                      borderColor: `color-mix(in srgb, ${themeColor}, transparent 60%)`,
                      color: themeColor,
                    } : {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {user.isHost && <span className="text-[10px] flex items-center">{RezeIcons.CROWN}</span>}
                    {user.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-3 flex flex-col gap-2 max-h-[300px]">
              {watchParty.messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-white/20 text-[12px] font-medium text-center">No messages yet. Say hi!</p>
                </div>
              ) : (
                watchParty.messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold" style={{ color: themeColor }}>{msg.senderName}</span>
                    <p className="text-white/80 text-[13px] font-medium leading-snug break-words">{msg.text}</p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={wpChatInput}
                  onChange={(e) => setWpChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter" && wpChatInput.trim()) {
                      watchParty.sendChat(wpChatInput.trim());
                      setWpChatInput("");
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] font-medium placeholder:text-white/20 outline-none focus:border-white/30 transition-colors"
                />
                <button
                  onClick={() => {
                    if (wpChatInput.trim()) {
                      watchParty.sendChat(wpChatInput.trim());
                      setWpChatInput("");
                    }
                  }}
                  disabled={!wpChatInput.trim()}
                  className="p-2.5 rounded-xl transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ backgroundColor: themeColor, color: '#000' }}
                >
                  <span className="text-lg flex items-center">{RezeIcons.SEND}</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

    return null;
  };

    return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black overflow-hidden w-full h-full select-none font-sans group/container",
        className
      )}
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
      onMouseLeave={() => {
        if (isPlaying && !settingsOpen) {
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
          setShowControls(false);
        }
      }}
    >
        {/* Full Screen Cinematic Backdrop */}
        <AnimatePresence>
          {(isLoading || isSwitchingSource) && poster && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="fixed inset-0 z-[-10] pointer-events-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-black" />
              <div 
                className="absolute inset-0 bg-cover bg-center blur-[80px] opacity-40 scale-110"
                style={{ backgroundImage: `url(${poster})` }}
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
            </motion.div>
          )}
        </AnimatePresence>

        <video
          ref={videoRef}
          className={cn(
            "w-full h-full object-contain transition-all duration-700 relative z-[1] bg-black",
            (isBuffering || isSwitchingSource) && "blur-[8px] scale-[1.02]"
          )}
          poster={poster}
          autoPlay={autoPlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onPlay={() => { setIsPlaying(true); lastStateRef.current.isPlaying = true; watchParty.sendPlay(videoRef.current?.currentTime || 0); }}
          onPause={() => { setIsPlaying(false); lastStateRef.current.isPlaying = false; watchParty.sendPause(videoRef.current?.currentTime || 0); }}
                onWaiting={() => setIsBuffering(true)}
            onCanPlay={() => {
              setIsBuffering(false);
              setIsSwitchingSource(false);
              if (autoPlay) {
                const video = videoRef.current;
                if (!video) return;

                const attemptPlay = async () => {
                  try {
                    await video.play();
                    setIsPlaying(true);
                  } catch (err) {
                    console.warn("Autoplay blocked, trying muted:", err);
                    video.muted = true;
                    setIsMuted(true);
                    try {
                      await video.play();
                      setIsPlaying(true);
                    } catch (mutedErr) {
                      console.error("Muted autoplay also failed:", mutedErr);
                      // Fallback to interaction
                      const retry = () => {
                        video.play().then(() => {
                          setIsPlaying(true);
                          window.removeEventListener('click', retry);
                          window.removeEventListener('keydown', retry);
                        }).catch(() => {});
                      };
                      window.addEventListener('click', retry);
                      window.addEventListener('keydown', retry);
                    }
                  }
                };
                attemptPlay();
              }
            }}
            onEnded={() => {
              if (nextEpisode && !autoNextTriggeredRef.current) {
                setShowAutoNextOverlay(true);
                setAutoNextCountdown(10);
                autoNextTriggeredRef.current = true;
              } else if (!nextEpisode && onEnded) {
                onEnded();
              }
            }}
            onError={handleServerError}
              playsInline
              {...({ "webkit-playsinline": "true" } as any)}
              onClick={togglePlay}
          >
            {/* Native <track> elements for iOS fullscreen subtitle support */}
            {activeSubtitle && nativeTrackUrls[activeSubtitle] && (
              <track
                key={activeSubtitle}
                kind="subtitles"
                label={activeSubtitle}
                srcLang={subtitles.find(s => s.id === activeSubtitle)?.language || "en"}
                src={nativeTrackUrls[activeSubtitle]}
                default
              />
            )}
          </video>

        {/* Backdrop Overlay */}
        <AnimatePresence>
          {(isLoading || isSwitchingSource) && poster && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 z-[2]"
            >
              {/* Blurred Background */}
              <div 
                className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-50"
                style={{ backgroundImage: `url(${poster})` }}
              />
              {/* Sharp Center Image */}
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat shadow-2xl"
                style={{ backgroundImage: `url(${poster})` }}
              />
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60" />
            </motion.div>
          )}
        </AnimatePresence>



        {/* Subtitles Overlay */}
        <AnimatePresence>
          {subtitleText && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    bottom: showControls ? "120px" : "15px"
                  }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ type: "spring", damping: 30, stiffness: 200 }}
                  className="absolute left-0 right-0 flex justify-center pointer-events-none px-8 text-center z-20"
                >
                  <span 
                    className={cn(
                      "font-black drop-shadow-[0_2px_4px_rgba(0,0,0,1)] drop-shadow-[0_4px_8px_rgba(0,0,0,1)] drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]",
                      subtitleSize === "small" && "text-base md:text-xl",
                      subtitleSize === "medium" && "text-lg md:text-3xl",
                      subtitleSize === "large" && "text-xl md:text-5xl",
                      subtitleSize === "xlarge" && "text-2xl md:text-7xl"
                    )}
                    style={{ 
                      color: subtitleColor,
                      fontFamily: subtitleFont
                    }}
                  >
                    {subtitleText}
                  </span>
              </motion.div>
          )}
        </AnimatePresence>

          {/* Buffering/Loading Spinner */}
          <AnimatePresence>
            {(isBuffering || isLoading || isSwitchingSource) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 20 }}
                      className="absolute top-8 right-8 pointer-events-none z-50 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl"
                    >
                      <div 
                        className="w-5 h-5 border-[3px] border-white/10 border-t-white rounded-full animate-spin"
                        style={{ borderTopColor: themeColor }}
                      />
                  </motion.div>
            )}
          </AnimatePresence>

          {/* No Sources Overlay */}
          <AnimatePresence>
            {!isLoading && !isSwitchingSource && servers.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[10] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-4 text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 text-3xl mb-2">
                    {RezeIcons.ERROR}
                  </div>
                  <h3 className="text-white text-xl font-bold">No Sources Found</h3>
                  <p className="text-white/40 text-sm max-w-[280px]">
                    We couldn't find any streaming sources for this content. Please try again later.
                  </p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all"
                  >
                    Retry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auto Next Episode Overlay */}
          <AnimatePresence>
            {showAutoNextOverlay && nextEpisode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute bottom-12 right-12 z-[60] flex flex-col items-end gap-3"
              >
                <div className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] min-w-[320px] overflow-hidden group/next relative">
                  <div 
                    className="absolute inset-0 opacity-20 blur-2xl scale-125 transition-transform duration-1000 group-hover/next:scale-150"
                    style={{ backgroundImage: poster ? `url(${poster})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col gap-5">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Next Episode</span>
                        <h4 className="text-white text-[17px] font-black leading-tight line-clamp-1">{nextEpisode.title}</h4>
                        <p className="text-white/50 text-[12px] font-bold tracking-wider">SEASON {nextEpisode.season} &bull; EPISODE {nextEpisode.episode}</p>
                      </div>
                      <div className="relative flex items-center justify-center shrink-0">
                        <svg className="w-16 h-16 transform -rotate-90 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-white/5"
                          />
                          <motion.circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={175.84}
                            strokeDashoffset={175.84 * (1 - autoNextCountdown / 10)}
                            className="transition-all duration-1000 ease-linear"
                            style={{ color: themeColor }}
                          />
                        </svg>
                        <span className="absolute text-white font-mono font-black text-lg tracking-tighter">{autoNextCountdown}</span>
                      </div>
                    </div>

                      <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); onAutoNext?.(); }}
                            className="flex-1 text-black h-12 rounded-2xl text-[12px] font-black uppercase tracking-[0.15em] transition-all hover:brightness-110 active:scale-[0.97]"
                            style={{ backgroundColor: themeColor, boxShadow: `0 8px 20px -4px color-mix(in srgb, ${themeColor}, transparent 60%)` }}
                          >
                          Play Now
                        </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setShowAutoNextOverlay(false); }}
                        className="px-6 h-12 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.15em] transition-all border border-white/10 backdrop-blur-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50 z-10"
            onClick={togglePlay}
          >
            {/* Top Info */}
            <div className="absolute top-0 left-0 right-0 p-8 flex flex-col items-center pointer-events-none">
                {title && (
                    <h3 className="text-white text-[18px] font-bold tracking-tight text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                        {title}
                    </h3>
                )}
                {subtitle && (
                    <p className="text-white/60 text-[13px] font-medium mt-1 text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Center Play/Skip Controls */}
            <div className="absolute inset-0 flex items-center justify-center gap-12 md:gap-28 pointer-events-none">
                <button 
                  onClick={(e) => { e.stopPropagation(); skip(-10); }} 
                  className="text-white transition-all hover:scale-110 active:scale-90 p-5 pointer-events-auto group"
                >
                  <span className="text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all duration-300">
                    {RezeIcons.SKIP_BACKWARD}
                  </span>
                </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                      className="text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 pointer-events-auto group p-8"
                    >
                      <span className="text-7xl transition-transform group-active:scale-90 drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        {isPlaying ? RezeIcons.PAUSE : RezeIcons.PLAY}
                      </span>
                    </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); skip(10); }} 
                  className="text-white transition-all hover:scale-110 active:scale-90 p-5 pointer-events-auto group"
                >
                  <span className="text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all duration-300">
                    {RezeIcons.SKIP_FORWARD}
                  </span>
                </button>

            </div>


            {/* Bottom Area */}
            <div 
              className="absolute bottom-0 left-0 right-0 px-8 pb-8 flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
                {/* Progress Bar + Timestamp Row */}
                <div className="flex items-center gap-3 mb-4 px-1">
                    <div className="relative group/progress flex-1">
                      <div 
                        ref={progressRef}
                        className="relative h-1.5 w-full bg-white/10 cursor-pointer overflow-hidden rounded-full group-hover/progress:h-2.5 transition-all duration-300"
                        onClick={handleSeek}
                      >
                        <div 
                          className="absolute h-full bg-white/20 transition-all duration-500"
                          style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }}
                        />
                        <div 
                          className="absolute h-full"
                          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, backgroundColor: themeColor }}
                        />
                      </div>
                    </div>
                    <span className="text-white/90 font-mono text-[13px] font-bold tracking-tight whitespace-nowrap flex items-center shrink-0">
                      {formatTime(currentTime)} <span className="mx-1.5 text-white/40">/</span> {formatTime(duration)}
                    </span>
                </div>

                    {/* Controls Layout */}
                    <div className="relative flex items-center justify-between min-h-[56px]">
                      {/* Left (Empty for balance) */}
                      <div className="flex-1" />

                      {/* Center: PiP, Settings, Chat */}
                      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-2">
                            <ControlButton onClick={togglePip} className="text-2xl">
                              {RezeIcons.PICTURE_IN_PICTURE}
                            </ControlButton>
                            
                            <ControlButton onClick={() => { setSettingsOpen(true); setSettingsView("main"); }} className="text-2xl">
                              {RezeIcons.SETTINGS}
                            </ControlButton>

                            {watchParty.roomCode && (
                              <div className="relative">
                                <ControlButton onClick={() => { setSettingsOpen(true); setSettingsView("watch_party_active"); setWpUnreadCount(0); }} className="text-2xl">
                                  {RezeIcons.CHAT}
                                </ControlButton>
                                {wpUnreadCount > 0 && (
                                  <span 
                                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black text-white px-1 pointer-events-none"
                                    style={{ backgroundColor: themeColor }}
                                  >
                                    {wpUnreadCount > 99 ? '99+' : wpUnreadCount}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
    
                        {/* Right: Fullscreen */}
                        <div className="flex-1 flex items-center justify-end gap-2">
                          <ControlButton onClick={toggleFullscreen} className="text-3xl p-2">
                            {isFullscreen ? RezeIcons.COMPRESS : RezeIcons.EXPAND}
                          </ControlButton>
                      </div>
                  </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="absolute inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#000000]/60 backdrop-blur-md"
              onClick={() => { setSettingsOpen(false); setSettingsView("main"); }}
            />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ 
                  type: "spring", 
                  damping: 25, 
                  stiffness: 300,
                  mass: 0.5
                }}
                className="relative w-full max-w-[400px] landscape:max-w-[850px] flex flex-col gap-3 max-h-full overflow-hidden"
              >

              {renderSettingsContent()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: ${themeColor} !important;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
            box-shadow: 0 0 10px color-mix(in srgb, ${themeColor}, transparent 60%);
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: ${themeColor} !important;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
            box-shadow: 0 0 10px color-mix(in srgb, ${themeColor}, transparent 60%);
        }
      `}</style>
    </div>
  );
}
