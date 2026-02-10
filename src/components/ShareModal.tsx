"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Facebook, Twitter, MessageCircle, Link, X, Send } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";

const SHARE_URL = "bcine.app";
const SHARE_MESSAGE = "Kindly share this with your friends and family. I truly appreciate your contribution.";

export function ShareModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [totalShares, setTotalShares] = useState<number | null>(null);
  const supabase = createClient();

  const fetchTotalShares = async () => {
    try {
      const { data, error } = await supabase
        .from('share_stats')
        .select('count');
      
      if (error) throw error;
      
      const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
      setTotalShares(total);
    } catch (error) {
      console.error("Error fetching shares:", error);
    }
  };

  useEffect(() => {
    const hidden = localStorage.getItem("hideShareModal");
    if (!hidden) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        fetchTotalShares();
      }, 3000); // Show after 3 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("hideShareModal", "true");
    }
    setIsOpen(false);
  };

  const trackShare = async (platform: string) => {
    try {
      await supabase.rpc('increment_share_count', { platform_name: platform });
      // Refresh total shares after tracking
      fetchTotalShares();
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(SHARE_MESSAGE)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(SHARE_MESSAGE + " " + SHARE_URL)}`,
    messenger: `fb-messenger://share/?link=${encodeURIComponent(SHARE_URL)}`,
  };

  const handleShare = (platform: string, url: string) => {
    trackShare(platform);
    window.open(url, "_blank");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SHARE_URL);
    trackShare("copy_link");
    toast.success("Link copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-md bg-background/40 backdrop-blur-2xl border-white/5 p-0 overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] outline-none" showCloseButton={false}>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ 
            type: "spring",
            damping: 25,
            stiffness: 120,
            mass: 1,
            duration: 0.8
          }}
          className="p-8 relative"
        >
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-3xl font-black tracking-tight bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent">
              Help us grow! 🚀
            </DialogTitle>
            <DialogDescription className="text-lg text-white/70 font-medium leading-relaxed italic">
              "{SHARE_MESSAGE}"
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-8">
            <Button
              variant="outline"
              className="group relative flex items-center justify-center gap-3 h-14 bg-white/5 border-white/10 hover:bg-blue-600 hover:border-blue-500 transition-all duration-500 rounded-2xl overflow-hidden"
              onClick={() => handleShare("facebook", shareLinks.facebook)}
            >
              <Facebook className="w-5 h-5 text-blue-500 group-hover:text-white transition-colors" />
              <span className="font-semibold tracking-wide group-hover:text-white">Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="group relative flex items-center justify-center gap-3 h-14 bg-white/5 border-white/10 hover:bg-sky-500 hover:border-sky-400 transition-all duration-500 rounded-2xl overflow-hidden"
              onClick={() => handleShare("twitter", shareLinks.twitter)}
            >
              <Twitter className="w-5 h-5 text-sky-400 group-hover:text-white transition-colors" />
              <span className="font-semibold tracking-wide group-hover:text-white">Twitter</span>
            </Button>
            <Button
              variant="outline"
              className="group relative flex items-center justify-center gap-3 h-14 bg-white/5 border-white/10 hover:bg-green-600 hover:border-green-500 transition-all duration-500 rounded-2xl overflow-hidden"
              onClick={() => handleShare("whatsapp", shareLinks.whatsapp)}
            >
              <MessageCircle className="w-5 h-5 text-green-500 group-hover:text-white transition-colors" />
              <span className="font-semibold tracking-wide group-hover:text-white">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              className="group relative flex items-center justify-center gap-3 h-14 bg-white/5 border-white/10 hover:bg-primary hover:border-primary/50 transition-all duration-500 rounded-2xl overflow-hidden"
              onClick={copyToClipboard}
            >
              <Link className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
              <span className="font-semibold tracking-wide group-hover:text-white">Copy Link</span>
            </Button>
          </div>

            <div className="flex flex-col items-center pt-6 pb-2 border-t border-white/[0.03] mt-4 space-y-6">
              <div className="flex items-center space-x-3 bg-white/[0.02] py-2.5 px-5 rounded-full border border-white/5 hover:border-white/10 transition-all duration-300">
                <Checkbox 
                  id="dontShow" 
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                  className="h-3.5 w-3.5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all scale-90"
                />
                <Label 
                  htmlFor="dontShow"
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 hover:text-white/60 cursor-pointer transition-colors"
                >
                  Don't show this again
                </Label>
              </div>

              {totalShares !== null && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-center w-full pb-2"
                >
                  <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/5 shadow-inner backdrop-blur-sm">
                    <Send className="w-2.5 h-2.5 text-primary/70 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40">
                      total share : {totalShares}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

          <button 
            onClick={handleClose}
            className="absolute right-6 top-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
          >
            <X className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
