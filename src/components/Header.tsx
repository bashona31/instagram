"use client";

import { motion } from "framer-motion";
import { WalletState, ThemeMode } from "@/types";
import { truncateAddress, formatBalance, copyToClipboard } from "@/utils";
import { DAC_NETWORK } from "@/lib/constants";
import toast from "react-hot-toast";

interface HeaderProps {
  wallet: WalletState;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export function Header({ wallet, theme, onToggleTheme, onConnect, onDisconnect, isConnecting }: HeaderProps) {
  const handleCopy = () => {
    if (wallet.address) {
      copyToClipboard(wallet.address);
      toast.success("Address copied!");
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-glow">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold gradient-text">DAC Bulk Sender</h1>
          <p className="text-xs text-neutral-500">{DAC_NETWORK.networkName} • Fast & Secure</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onToggleTheme} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-neutral-400 hover:text-pink-400 transition-colors" title="Toggle theme">
          {theme === "dark" ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>

        {wallet.isConnected ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-pink-500/10 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-pink-400">{formatBalance(wallet.balance)} {DAC_NETWORK.currencySymbol}</span>
            </div>
            <button onClick={handleCopy} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:border-pink-500/30 transition-all" title="Copy address">
              <span className="font-mono">{truncateAddress(wallet.address || "", 4)}</span>
              <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
            <button onClick={onDisconnect} className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="Disconnect">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        ) : (
          <button onClick={onConnect} disabled={isConnecting} className="btn-primary flex items-center gap-2 text-sm">
            {isConnecting ? (
              <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Connecting...</>
            ) : (
              <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Connect Wallet</>
            )}
          </button>
        )}
      </div>
    </motion.header>
  );
}
