"use client";

import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";

interface Props {
  onConnect: () => void;
  isConnecting: boolean;
  isMetaMaskAvailable: boolean;
}

export function WalletPrompt({ onConnect, isConnecting, isMetaMaskAvailable }: Props) {
  return (
    <GlassCard className="text-center py-16 px-8" delay={0.2}>
      <motion.div animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl
          bg-gradient-to-br from-pink-500/20 to-pink-600/20 border border-pink-500/30">
        <svg className="h-10 w-10 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </motion.div>


      <h2 className="mb-3 text-2xl font-bold gradient-text">Connect Your Wallet</h2>
      <p className="mb-8 text-neutral-400 max-w-md mx-auto">
        Connect your MetaMask wallet to start sending DACC tokens to multiple addresses at once.
      </p>

      {isMetaMaskAvailable ? (
        <button onClick={onConnect} disabled={isConnecting} className="btn-primary mx-auto inline-flex items-center gap-3 px-8 py-4 text-base">
          {isConnecting ? (
            <><svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Connecting...</>
          ) : (
            <><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Connect MetaMask</>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-red-400">MetaMask is not installed</p>
          <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">Install MetaMask</a>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
        {[{ title: "Bulk Send", desc: "Send to 100s of wallets at once" },
          { title: "Gas Optimized", desc: "Efficient batched transactions" },
          { title: "CSV Support", desc: "Upload recipients via CSV file" }].map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
            className="rounded-xl bg-white/5 p-4 border border-white/5">
            <h4 className="font-semibold text-sm">{f.title}</h4>
            <p className="text-xs text-neutral-500 mt-1">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
