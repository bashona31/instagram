"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max,
  className = "",
  showLabel = true,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-pink-400">{percentage}%</span>
        </div>
      )}
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/5 backdrop-blur-sm">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-pink-500 to-pink-400"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            boxShadow: "0 0 10px rgba(236, 72, 153, 0.5)",
          }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-muted-foreground">
          {value} / {max} transactions
        </div>
      )}
    </div>
  );
}
