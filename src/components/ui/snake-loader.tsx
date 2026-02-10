"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SnakeLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "w-6 h-6",
  md: "w-10 h-10",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export function SnakeLoader({ className, size = "md" }: SnakeLoaderProps) {
  return (
    <div className={cn("relative flex items-center justify-center", sizes[size], className)}>
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute inset-1 rounded-full border-2 border-transparent border-t-primary/60 border-l-primary/60"
        animate={{ rotate: -360 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border-2 border-transparent border-t-primary/30 border-r-primary/30"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}
