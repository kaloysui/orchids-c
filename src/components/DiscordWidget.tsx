"use client";

import { useEffect, useState } from "react";
import { FaDiscord, FaCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface DiscordMember {
  id: string;
  username: string;
  avatar_url: string;
  status: "online" | "idle" | "dnd" | string;
}

interface DiscordData {
  guild: {
    id: string;
    name: string;
    icon: string;
  };
  approximate_member_count: number;
  approximate_presence_count: number;
  members?: DiscordMember[];
}

const statusColors: Record<string, string> = {
  online: "#23a55a",
  idle: "#f0b232",
  dnd: "#f23f43",
  default: "#80848e",
};

export function DiscordWidget() {
  const [data, setData] = useState<DiscordData | null>(null);
  const [loading, setLoading] = useState(true);
  const INVITE_CODE = "mrPsGSDb5";
  const DISCORD_URL = `https://discord.gg/${INVITE_CODE}`;

  useEffect(() => {
    const fetchDiscordData = async () => {
      try {
        const inviteRes = await fetch(`https://discord.com/api/v9/invites/${INVITE_CODE}?with_counts=true`);
        if (inviteRes.ok) {
          const inviteData = await inviteRes.json();
          
          try {
            const widgetRes = await fetch(`https://discord.com/api/guilds/${inviteData.guild.id}/widget.json`);
            if (widgetRes.ok) {
              const widgetData = await widgetRes.json();
              setData({
                ...inviteData,
                members: widgetData.members?.slice(0, 10) || []
              });
            } else {
              setData(inviteData);
            }
          } catch {
            setData(inviteData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch Discord data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscordData();
    const interval = setInterval(fetchDiscordData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-2">
        <Card className="w-full h-16 bg-zinc-900/50 border-zinc-800 animate-pulse rounded-xl" />
      </div>
    );
  }

  const onlineCount = data?.approximate_presence_count || 0;
  const totalCount = data?.approximate_member_count || 0;
  
  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: DISCORD_URL } }, "*");
    window.open(DISCORD_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto px-4 py-6"
    >
      <Card className="relative overflow-hidden bg-zinc-900/40 border-zinc-800/50 hover:border-[#5865F2]/30 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-2xl transition-all duration-300 group">
        {/* Discord Icon Watermark */}
        <div className="absolute -right-6 -bottom-6 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
          <FaDiscord size={180} />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1 max-w-sm">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Join our community
                <span className="inline-block animate-bounce text-[#5865F2]">!</span>
              </h2>
              
              <p className="text-xs md:text-sm text-zinc-400 font-medium leading-relaxed mb-1">
                Join our Discord to stay informed about upcoming updates and chat with fellow binge-watchers!
              </p>
              
              <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  {onlineCount.toLocaleString()} Online
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-zinc-600" />
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  {totalCount.toLocaleString()} Members
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            {data?.members && data.members.length > 0 && (
              <div className="flex -space-x-2 overflow-hidden py-1">
                {data.members.map((member) => (
                  <div 
                    key={member.id} 
                    className="relative"
                    title={`${member.username} (${member.status})`}
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-zinc-900 overflow-hidden bg-zinc-800 hover:scale-110 transition-transform cursor-help">
                      <img 
                        src={member.avatar_url} 
                        alt={member.username} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div 
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900"
                      style={{ backgroundColor: statusColors[member.status] || statusColors.default }}
                    />
                  </div>
                ))}
                {totalCount > 10 && (
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 z-10">
                    +{(totalCount - 10) > 99 ? '99' : (totalCount - 10)}
                  </div>
                )}
              </div>
            )}

            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleJoin}
              className="flex items-center gap-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-2.5 text-sm font-black rounded-full transition-all active:scale-95 shadow-[0_0_20px_rgba(88,101,242,0.3)] hover:shadow-[0_0_30px_rgba(88,101,242,0.4)] group-hover:scale-105"
            >
              <FaDiscord size={18} />
              JOIN SERVER
            </a>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
