"use client";
/**
 * MAIN PAGE - DAC Bulk Sender & Token Creator
 * 
 * TRANSACTION FLOW (how Send button works):
 * 1. User enters addresses + amounts
 * 2. User clicks "Validate" → shows preview with Send button
 * 3. User clicks SEND button → handleSend() called
 * 4. handleSend() gets signer via getSigner() 
 * 5. Passes signer to startProcessing()
 * 6. startProcessing() calls signer.sendTransaction() for EACH recipient
 * 7. Each sendTransaction() TRIGGERS METAMASK POPUP
 * 8. After user confirms, tx.wait() waits for blockchain confirmation
 * 9. UI updates with real hash from blockchain
 */

import { useCallback, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useWallet, useTransactionQueue } from "@/hooks";
import { Header } from "@/components/Header";
import { BulkSenderForm } from "@/components/BulkSenderForm";
import { TransactionProgress } from "@/components/TransactionProgress";
import { TokenCreator } from "@/components/TokenCreator";
import { TransactionHistory } from "@/components/TransactionHistory";
import { Recipient, SendMode, TabView } from "@/types";

export default function HomePage() {
  const { wallet, isConnecting, connect, disconnect, getSigner } = useWallet();
  const { state: queueState, startProcessing, pause, resume, cancel, reset } = useTransactionQueue();
  const [activeTab, setActiveTab] = useState<TabView>("sender");

  const handleConnect = useCallback(async () => {
    try {
      await connect();
      toast.success("Wallet connected!");
    } catch (err: any) {
      toast.error(err?.message || "Connection failed");
    }
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    reset();
    toast.success("Disconnected");
  }, [disconnect, reset]);

  /**
   * HANDLE SEND - This is the critical function that triggers real transactions
   */
  const handleSend = useCallback(async (
    recipients: Recipient[], mode: SendMode, tokenAddress?: string
  ) => {
    console.log("[Page] handleSend called with", recipients.length, "recipients");

    // Step 1: Get the signer (this ensures wallet is properly connected)
    let signer;
    try {
      signer = await getSigner();
      console.log("[Page] Got signer:", await signer.getAddress());
    } catch (err: any) {
      toast.error("Wallet not connected properly. Please reconnect.");
      console.error("[Page] getSigner failed:", err);
      return;
    }

    // Step 2: Start processing with REAL signer
    toast.loading(`Sending to ${recipients.length} wallets...`, { id: "bulk" });

    try {
      await startProcessing(signer, recipients, mode, tokenAddress, 18);
      toast.dismiss("bulk");
      toast.success("All transactions processed! Check results below.");
    } catch (err: any) {
      toast.dismiss("bulk");
      toast.error(err?.message || "Processing failed");
      console.error("[Page] startProcessing error:", err);
    }
  }, [getSigner, startProcessing]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: "rgba(10,10,26,0.95)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }
      }} />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Header wallet={wallet} activeTab={activeTab} setActiveTab={setActiveTab}
          onConnect={handleConnect} onDisconnect={handleDisconnect} isConnecting={isConnecting} />

        {/* Network Badge */}
        {wallet.isConnected && (
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">DAC Testnet Connected</span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "sender" && (
            <>
              <BulkSenderForm onSend={handleSend} isProcessing={queueState.isRunning} walletConnected={wallet.isConnected} />
              <TransactionProgress state={queueState} onPause={pause} onResume={resume} onCancel={cancel} />
            </>
          )}

          {activeTab === "creator" && (
            <TokenCreator getSigner={getSigner} walletConnected={wallet.isConnected} />
          )}

          {activeTab === "history" && (
            <TransactionHistory state={queueState} />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 border-t border-white/5 py-6 text-center">
          <p className="text-xs text-neutral-500">DAC Bulk Sender & Token Creator • DAC Testnet • Chain ID: 21894</p>
        </footer>
      </div>
    </>
  );
}
