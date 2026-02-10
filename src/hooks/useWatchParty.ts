"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface WatchPartyUser {
  id: string;
  name: string;
  isHost: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface WatchPartyState {
  isActive: boolean;
  roomCode: string | null;
  isHost: boolean;
  users: WatchPartyUser[];
  messages: ChatMessage[];
  error: string | null;
}

interface BroadcastPayload {
  type: "play" | "pause" | "seek" | "sync_request" | "sync_response" | "chat";
  currentTime?: number;
  isPlaying?: boolean;
  senderId: string;
  senderName?: string;
  text?: string;
  messageId?: string;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateUserId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function useWatchParty(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onRemotePlay?: () => void,
  onRemotePause?: () => void,
  onRemoteSeek?: (time: number) => void,
) {
  const [state, setState] = useState<WatchPartyState>({
    isActive: false,
    roomCode: null,
    isHost: false,
    users: [],
    messages: [],
    error: null,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string>(generateUserId());
  const userNameRef = useRef<string>("");
  const isRemoteActionRef = useRef(false);
  const supabaseRef = useRef(createClient());

  const setUserName = useCallback((name: string) => {
    userNameRef.current = name;
  }, []);

  const broadcast = useCallback((payload: BroadcastPayload) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "watch_party",
      payload,
    });
  }, []);

  const sendPlay = useCallback((currentTime: number) => {
    if (!state.isActive || isRemoteActionRef.current) return;
    broadcast({ type: "play", currentTime, senderId: userIdRef.current });
  }, [state.isActive, broadcast]);

  const sendPause = useCallback((currentTime: number) => {
    if (!state.isActive || isRemoteActionRef.current) return;
    broadcast({ type: "pause", currentTime, senderId: userIdRef.current });
  }, [state.isActive, broadcast]);

  const sendSeek = useCallback((currentTime: number) => {
    if (!state.isActive || isRemoteActionRef.current) return;
    broadcast({ type: "seek", currentTime, senderId: userIdRef.current });
  }, [state.isActive, broadcast]);

  const sendChat = useCallback((text: string) => {
    if (!state.isActive || !text.trim()) return;
    const messageId = `${userIdRef.current}-${Date.now()}`;
    const msg: ChatMessage = {
      id: messageId,
      senderId: userIdRef.current,
      senderName: userNameRef.current,
      text: text.trim(),
      timestamp: Date.now(),
    };
    // Add to own messages immediately
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, msg].slice(-100),
    }));
    broadcast({
      type: "chat",
      senderId: userIdRef.current,
      senderName: userNameRef.current,
      text: text.trim(),
      messageId,
    });
  }, [state.isActive, broadcast]);

  const handleBroadcast = useCallback(({ payload }: { payload: BroadcastPayload }) => {
    const userId = userIdRef.current;
    if (payload.senderId === userId) return;

    if (payload.type === "chat") {
      const msg: ChatMessage = {
        id: payload.messageId || `${payload.senderId}-${Date.now()}`,
        senderId: payload.senderId,
        senderName: payload.senderName || "Unknown",
        text: payload.text || "",
        timestamp: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, msg].slice(-100),
      }));
      return;
    }

    isRemoteActionRef.current = true;

    switch (payload.type) {
      case "play":
        if (payload.currentTime !== undefined) onRemoteSeek?.(payload.currentTime);
        onRemotePlay?.();
        break;
      case "pause":
        if (payload.currentTime !== undefined) onRemoteSeek?.(payload.currentTime);
        onRemotePause?.();
        break;
      case "seek":
        if (payload.currentTime !== undefined) onRemoteSeek?.(payload.currentTime);
        break;
      case "sync_request":
        if (videoRef.current) {
          broadcast({
            type: "sync_response",
            currentTime: videoRef.current.currentTime,
            isPlaying: !videoRef.current.paused,
            senderId: userId,
          });
        }
        break;
      case "sync_response":
        if (payload.currentTime !== undefined) onRemoteSeek?.(payload.currentTime);
        if (payload.isPlaying) onRemotePlay?.();
        else onRemotePause?.();
        break;
    }

    setTimeout(() => { isRemoteActionRef.current = false; }, 100);
  }, [broadcast, onRemotePlay, onRemotePause, onRemoteSeek, videoRef]);

  const handlePresenceSync = useCallback((channel: RealtimeChannel) => {
    const presenceState = channel.presenceState();
    const users: WatchPartyUser[] = [];
    for (const [, presences] of Object.entries(presenceState)) {
      const p = (presences as any)[0];
      if (p) {
        users.push({ id: p.userId, name: p.userName, isHost: p.isHost });
      }
    }
    setState((prev) => ({ ...prev, users }));
  }, []);

  const setupChannel = useCallback((roomCode: string, isHost: boolean) => {
    const supabase = supabaseRef.current;
    const userId = userIdRef.current;
    const userName = userNameRef.current;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel(`watch-party:${roomCode}`, {
      config: { broadcast: { self: false }, presence: { key: userId } },
    });

    channel.on("broadcast", { event: "watch_party" }, handleBroadcast);

    channel.on("presence", { event: "sync" }, () => {
      handlePresenceSync(channel);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ userId, userName, isHost });

        if (!isHost) {
          broadcast({ type: "sync_request", senderId: userId });
        }

        setState((prev) => ({
          ...prev,
          isActive: true,
          roomCode,
          isHost,
          error: null,
          messages: [],
        }));
      } else if (status === "CHANNEL_ERROR") {
        setState((prev) => ({ ...prev, error: isHost ? "Failed to create room" : "Failed to join room" }));
      }
    });

    channelRef.current = channel;
  }, [broadcast, handleBroadcast, handlePresenceSync]);

  const createRoom = useCallback((username: string) => {
    userNameRef.current = username;
    const roomCode = generateRoomCode();
    setupChannel(roomCode, true);
  }, [setupChannel]);

  const joinRoom = useCallback((roomCode: string, username: string) => {
    userNameRef.current = username;
    setupChannel(roomCode.toUpperCase(), false);
  }, [setupChannel]);

  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      supabaseRef.current.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setState({
      isActive: false,
      roomCode: null,
      isHost: false,
      users: [],
      messages: [],
      error: null,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    ...state,
    createRoom,
    joinRoom,
    leaveRoom,
    sendPlay,
    sendPause,
    sendSeek,
    sendChat,
    setUserName,
    isRemoteAction: () => isRemoteActionRef.current,
    userName: userNameRef.current,
  };
}
