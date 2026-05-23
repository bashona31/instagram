"use client";

// ============================================================
// NetworkBadge Component - Shows current network status
// ============================================================

import { motion } from "framer-motion";
import { DAC_NETWORK } from "@/lib/constants";

interface NetworkBadgeProps {
  isCorrectNetwork: boolean;
  onSwitch: () => void;
}

export function NetworkBadge({ isCorrectNetwork, onSwitch }: NetworkBadgeProps) {
  if (isCorrectNetwork) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20"
      >
        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-medium text-emerald-400">
          {DAC_NETWORK.networkName}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onSwitch}
      className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5 border border-red-500/20 transition-all hover:bg-red-500/20"
    >
      <div className="h-2 w-2 rounded-full bg-red-400" />
      <span className="text-xs font-medium text-red-400">
        Wrong Network - Switch
      </span>
    </motion.button>
  );
}
