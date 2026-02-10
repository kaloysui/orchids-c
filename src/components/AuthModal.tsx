"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Shield, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
import { SnakeLoader } from "@/components/ui/snake-loader";
import { motion, AnimatePresence } from "framer-motion";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: "login" | "register";
  title?: string;
  description?: string;
}

export function AuthModal({ isOpen, onClose, initialView = "login", title, description }: AuthModalProps) {
  const [view, setView] = useState<"login" | "register">(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
        if (view === "login") {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          setSuccess("Welcome back! Entering bCine...");
          setTimeout(() => {
            onClose();
            window.location.reload(); 
          }, 1500);
          } else {
            // Automatic Register: Sign up and handle session immediately
            const { error, data } = await supabase.auth.signUp({
              email,
              password,
            });
            if (error) throw error;
            
            if (data?.session) {
              setSuccess("Account created! Welcome to bCine.");
              setTimeout(() => {
                onClose();
                window.location.reload();
              }, 1500);
            } else {
              // Even if verification is on, we'll try to sign them in
              // We won't mention email verification at all to keep the UI clean
              setSuccess("Account created! Logging you in...");
              
              const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
                email,
                password
              });
              
              if (!signInError && signInData?.session) {
                setTimeout(() => {
                  onClose();
                  window.location.reload();
                }, 1500);
              } else {
                setSuccess("Registration successful! You can now sign in.");
                setView("login");
              }
            }
          }
    } catch (error: any) {
      let message = error.message;
      if (message.includes("Invalid login credentials")) {
        message = "Incorrect email or password. Please try again.";
      } else if (message.includes("User already registered")) {
        message = "This email is already registered. Please sign in.";
      } else if (message.includes("Email not confirmed")) {
        message = "Login failed. Please try a different method or check your details.";
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-[480px] max-h-[90vh] p-0 overflow-y-auto border-border bg-background/90 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] scrollbar-hide focus:outline-none"
      >
        <div className="relative p-6 md:p-10 space-y-8 overflow-hidden rounded-3xl">
          {/* Background Decorative Elements - Simplified for performance */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

          <DialogHeader className="space-y-4 text-center">
            <div className="space-y-2">
              <DialogTitle className="text-4xl font-black tracking-tight text-foreground uppercase leading-tight">
                {title || (view === "login" ? "Welcome Back" : "Join the Club")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-base font-medium">
                {description || (view === "login"
                  ? "Access your synced watchlist across all your devices."
                  : "Start building your ultimate movie collection today.")}
              </DialogDescription>
            </div>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 text-sm font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl"
              >
                <div className="p-1.5 rounded-lg bg-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <p>{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 text-sm font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p>{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.2em] ml-1">
                    Email
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Mail className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-muted/40 border-border/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary h-14 pl-12 rounded-2xl transition-all hover:bg-muted/60 border-2"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" title="password" className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.2em] ml-1">
                    Password
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-muted/40 border-border/50 text-foreground focus-visible:ring-primary h-14 pl-12 rounded-2xl transition-all hover:bg-muted/60 border-2"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-sm font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl transition-all duration-300 active:scale-[0.98] rounded-2xl group relative overflow-hidden uppercase tracking-widest" 
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {isLoading ? (
                    <SnakeLoader size="sm" />
                  ) : (
                  <span className="flex items-center gap-2">
                    {view === "login" ? "Sign In" : "Sign Up"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
              </form>

              <div className="text-center pt-2 space-y-4">
                <button
                  type="button"
                  onClick={() => setView(view === "login" ? "register" : "login")}
                  className="text-[10px] text-muted-foreground hover:text-foreground font-bold uppercase tracking-[0.2em] transition-colors"
                >
                  {view === "login" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>
          </div>

      </DialogContent>
    </Dialog>
  );
}
