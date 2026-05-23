"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
  hover?: boolean;
}

export function GlassCard({
  children,
  className = "",
  animate = true,
  delay = 0,
  hover = true,
}: GlassCardProps) {
  const baseClasses =
    "glass-card p-6 transition-all duration-300";
  const hoverClasses = hover
    ? "hover:border-pink-500/30 hover:shadow-glow"
    : "";

  if (!animate) {
    return (
      <div className={`${baseClasses} ${hoverClasses} ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`${baseClasses} ${hoverClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
}
