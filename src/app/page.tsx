"use client";

// ============================================================
// Main Page - DAC Bulk Sender Application
// ============================================================

import { useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useWallet, useTransactionQueue, useTheme } from "@/hooks";
import {
  Header,
  BulkSenderForm,
  TransactionProgress,
  AnalyticsDashboard,
  NetworkBadge,
  WalletPrompt,
  Footer,
} from "@/components";
import { Recipient, SendMode } from "@/types";

export default function HomePage() {
  const { wallet, signer, isConnecting, isMetaMaskAvailable, connect, disconnect, switchNetwork, refreshBalance } = useWallet();
  const { queueState, startProcessing, pause, resume, cancel, reset } = useTransactionQueue();
  const { theme, toggleTheme } = useTheme();

  /**
   * Handle wallet connection
   */
  const handleConnect = useCallback(async () => {
    try {
      await connect();
      toast.success("Wallet connected successfully!", {
        style: {
          background: "rgba(16, 16, 32, 0.95)",
          color: "#fff",
          border: "1px solid rgba(236, 72, 153, 0.3)",
        },
        iconTheme: { primary: "#ec4899", secondary: "#fff" },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to connect wallet";
      toast.error(message, {
        style: {
          background: "rgba(16, 16, 32, 0.95)",
          color: "#fff",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        },
      });
    }
  }, [connect]);

  /**
   * Handle wallet disconnection
   */
  const handleDisconnect = useCallback(() => {
    disconnect();
    reset();
    toast.success("Wallet disconnected", {
      style: {
        background: "rgba(16, 16, 32, 0.95)",
        color: "#fff",
        border: "1px solid rgba(236, 72, 153, 0.3)",
      },
    });
  }, [disconnect, reset]);

  /**
   * Handle bulk send submission
   */
  const handleSubmit = useCallback(
    async (recipients: Recipient[], mode: SendMode, tokenAddress?: string) => {
      if (!signer) {
        toast.error("Please connect your wallet first");
        return;
      }

      toast.loading(`Sending to ${recipients.length} recipients...`, {
        id: "bulk-send",
        style: {
          background: "rgba(16, 16, 32, 0.95)",
          color: "#fff",
          border: "1px solid rgba(236, 72, 153, 0.3)",
        },
      });

      try {
        await startProcessing(signer, recipients, mode, tokenAddress, 18);
        toast.dismiss("bulk-send");
        toast.success("All transactions processed!", {
          style: {
            background: "rgba(16, 16, 32, 0.95)",
            color: "#fff",
            border: "1px solid rgba(16, 185, 129, 0.3)",
          },
          iconTheme: { primary: "#10b981", secondary: "#fff" },
        });
        // Refresh balance after sending
        refreshBalance();
      } catch (error: unknown) {
        toast.dismiss("bulk-send");
        const message = error instanceof Error ? error.message : "Transaction processing failed";
        toast.error(message, {
          style: {
            background: "rgba(16, 16, 32, 0.95)",
            color: "#fff",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          },
        });
      }
    },
    [signer, startProcessing, refreshBalance]
  );

  return (
    <>
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(16, 16, 32, 0.95)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            backdropFilter: "blur(10px)",
          },
        }}
      />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <Header
          wallet={wallet}
          theme={theme}
          onToggleTheme={toggleTheme}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          isConnecting={isConnecting}
        />

        {/* Network Badge */}
        {wallet.isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex justify-center"
          >
            <NetworkBadge
              isCorrectNetwork={wallet.isCorrectNetwork}
              onSwitch={switchNetwork}
            />
          </motion.div>
        )}

        {/* Main Content */}
        {!wallet.isConnected ? (
          <WalletPrompt
            onConnect={handleConnect}
            isConnecting={isConnecting}
            isMetaMaskAvailable={isMetaMaskAvailable}
          />
        ) : (
          <div className="space-y-6">
            {/* Bulk Sender Form */}
            <BulkSenderForm
              onSubmit={handleSubmit}
              isProcessing={queueState.isRunning}
              walletConnected={wallet.isConnected}
            />

            {/* Transaction Progress */}
            <TransactionProgress
              queueState={queueState}
              onPause={pause}
              onResume={resume}
              onCancel={cancel}
            />

            {/* Analytics Dashboard */}
            <AnalyticsDashboard queueState={queueState} />
          </div>
        )}

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
