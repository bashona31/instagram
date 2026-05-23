"use client";
import { motion } from "framer-motion";
import { WalletState, TabView } from "@/types";
import { truncateAddress, formatBalance, copyToClipboard } from "@/utils";
import { DAC_NETWORK } from "@/lib/constants";
import toast from "react-hot-toast";

interface Props {
  wallet: WalletState;
  activeTab: TabView;
  setActiveTab: (t: TabView) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export function Header({ wallet, activeTab, setActiveTab, onConnect, onDisconnect, isConnecting }: Props) {
  const handleCopy = () => {
    if (wallet.address) { copyToClipboard(wallet.address); toast.success("Address copied!"); }
  };

  return (
    <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-glow">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold gradient-text">DAC Bulk Sender</h1>
          <p className="text-xs text-neutral-500">{DAC_NETWORK.networkName} • Chain {DAC_NETWORK.chainId}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-white/5 p-1">
        {(["sender", "creator", "history"] as TabView[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-pink-500 text-white shadow-glow" : "text-neutral-400 hover:text-white"}`}>
            {tab === "sender" ? "Bulk Send" : tab === "creator" ? "Create Token" : "History"}
          </button>
        ))}
      </div>

      {/* Wallet */}
      <div className="flex items-center gap-2">
        {wallet.isConnected ? (
          <>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-emerald-400">{formatBalance(wallet.balance)} {DAC_NETWORK.currencySymbol}</span>
            </div>
            <button onClick={handleCopy} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-sm hover:border-pink-500/30 transition-all">
              {truncateAddress(wallet.address || "")}
            </button>
            <button onClick={onDisconnect} className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Disconnect">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </>
        ) : (
          <button onClick={onConnect} disabled={isConnecting} className="btn-primary flex items-center gap-2 text-sm">
            {isConnecting ? <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Connecting...</> : "Connect Wallet"}
          </button>
        )}
      </div>
    </motion.header>
  );
}
