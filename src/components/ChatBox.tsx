"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, Bot, Trash2, TrendingUp, Star, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

interface MovieResult {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: string;
  release_date: string;
  vote_average: number;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  results?: MovieResult[];
}

const QUICK_ACTIONS = [
  { label: "Trending", icon: TrendingUp, query: "What's trending today?" },
  { label: "Top Rated", icon: Star, query: "Show me some top rated classics" },
  { label: "Action", icon: Zap, query: "I want some high-octane action movies" },
  { label: "Comedy", icon: Bot, query: "Recommend some comedies" },
];

export function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setIsLoading: setGlobalLoading } = useGlobalLoading();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'ai',
          content: "Hello! I'm your bCine movie assistant. How can I help you today?",
          timestamp: new Date(),
        }
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (query: string = input) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query,
          history: messages.slice(-5).map(m => ({ role: m.role, content: m.content })) 
        }),
      });

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.response,
        timestamp: new Date(),
        results: data.results,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        id: 'error',
        role: 'ai',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-4 w-[260px] sm:w-[300px] h-[380px] bg-background/40 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl flex flex-col overflow-hidden"
            >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold text-xs tracking-tight text-foreground/90">bCine Assistant</span>
              </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearChat}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide relative">
              <div className="mb-4 p-2.5 rounded-xl bg-primary/5 border border-primary/10 flex flex-col gap-1.5">
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Having a problem on video provider? Go to{" "}
                  <Link 
                    href="/settings" 
                    onClick={() => setIsOpen(false)}
                    className="text-primary hover:underline font-bold"
                  >
                    Settings
                  </Link>{" "}
                  tapos go scroll down you will see <span className="text-foreground font-medium">Video Providers</span> and try switching sources.
                </p>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-1.5",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}
                >
                    <div
                      className={cn(
                        "max-w-[90%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                        msg.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/10 text-foreground border border-white/5"
                      )}
                    >
                      {msg.role === 'ai' ? (
                        <div className="whitespace-pre-wrap">
                          {msg.content.split(/(\[\[.*?\]\])/).map((part, i) => {
                            if (part.startsWith('[[') && part.endsWith(']]')) {
                              const [title, type, id] = part.slice(2, -2).split('|');
                              return (
                                <Link
                                  key={i}
                                  href={`/${type}/${id}`}
                                  onClick={() => {
                                    setIsOpen(false);
                                    setGlobalLoading(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-colors border border-primary/20"
                                >
                                  {title}
                                  <Zap className="w-3 h-3" />
                                </Link>
                              );
                            }
                            return part;
                          })}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>

                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-[10px] font-medium tracking-wider uppercase">Thinking</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-3 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide border-t border-white/10 bg-white/5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.query)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/30 text-[10px] font-medium transition-all text-foreground/80"
                >
                  <action.icon className="w-3 h-3 text-primary" />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white/5 border-t border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask bCine..."
                  className="h-9 rounded-xl bg-white/5 border-white/10 text-xs focus-visible:ring-primary/30"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border border-white/10",
          isOpen ? "bg-white/10 text-foreground backdrop-blur-md" : "bg-primary text-primary-foreground"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </Button>
    </div>
  );
}
