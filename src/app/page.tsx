"use client";

import { useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useWallet, useTransactionQueue, useTheme } from "@/hooks";
import { Header } from "@/components/Header";
import { BulkSenderForm } from "@/components/BulkSenderForm";
import { TransactionProgress } from "@/components/TransactionProgress";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { WalletPrompt } from "@/components/WalletPrompt";
import { Footer } from "@/components/Footer";
import { Recipient, SendMode } from "@/types";

export default function HomePage() {
  const { wallet, signer, isConnecting, isMetaMaskAvailable,
    connect, disconnect, switchNetwork, refreshBalance } = useWallet();
  const { queueState, startProcessing, pause, resume, cancel, reset }
    = useTransactionQueue();
  const { theme, toggleTheme } = useTheme();


  const handleConnect = useCallback(async () => {
    try {
      await connect();
      toast.success("Wallet connected!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to connect");
    }
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    reset();
    toast.success("Wallet disconnected");
  }, [disconnect, reset]);

  const handleSubmit = useCallback(async (
    recipients: Recipient[], mode: SendMode, tokenAddress?: string
  ) => {
    if (!signer) { toast.error("Connect wallet first"); return; }
    toast.loading(`Sending to ${recipients.length} recipients...`, { id: "bs" });
    try {
      await startProcessing(signer, recipients, mode, tokenAddress, 18);
      toast.dismiss("bs");
      toast.success("All transactions processed!");
      refreshBalance();
    } catch (err: any) {
      toast.dismiss("bs");
      toast.error(err?.message || "Failed");
    }
  }, [signer, startProcessing, refreshBalance]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: {
        background: "rgba(10,10,26,0.95)", color: "#fff",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
      }}} />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Header wallet={wallet} theme={theme} onToggleTheme={toggleTheme}
          onConnect={handleConnect} onDisconnect={handleDisconnect} isConnecting={isConnecting} />


        {wallet.isConnected && !wallet.isCorrectNetwork && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex justify-center">
            <button onClick={switchNetwork} className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 transition-all">
              <div className="h-2 w-2 rounded-full bg-red-400" /> Wrong Network - Click to Switch
            </button>
          </motion.div>
        )}

        {wallet.isConnected && wallet.isCorrectNetwork && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">DAC Testnet</span>
            </div>
          </motion.div>
        )}

        {!wallet.isConnected ? (
          <WalletPrompt onConnect={handleConnect} isConnecting={isConnecting} isMetaMaskAvailable={isMetaMaskAvailable} />
        ) : (
          <div className="space-y-6">
            <BulkSenderForm onSubmit={handleSubmit} isProcessing={queueState.isRunning} walletConnected={wallet.isConnected} />
            <TransactionProgress queueState={queueState} onPause={pause} onResume={resume} onCancel={cancel} />
            <AnalyticsDashboard queueState={queueState} />
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}
