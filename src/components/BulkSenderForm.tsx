"use client";
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Recipient, SendMode } from "@/types";
import { parseRecipients } from "@/utils";
import { DAC_NETWORK } from "@/lib/constants";

interface Props {
  onSend: (recipients: Recipient[], mode: SendMode, tokenAddress?: string) => void;
  isProcessing: boolean;
  walletConnected: boolean;
}

export function BulkSenderForm({ onSend, isProcessing, walletConnected }: Props) {
  const [mode, setMode] = useState<SendMode>("native");
  const [tokenAddress, setTokenAddress] = useState("");
  const [input, setInput] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isDrag, setIsDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleValidate = () => {
    if (!input.trim()) return;
    setRecipients(parseRecipients(input));
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(text);
      setRecipients(parseRecipients(text));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent) => { e.preventDefault(); setIsDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  const handleSend = () => {
    const valid = recipients.filter(r => r.isValid);
    if (valid.length === 0) return;
    onSend(valid, mode, mode === "erc20" ? tokenAddress : undefined);
  };

  const validCount = recipients.filter(r => r.isValid).length;
  const totalAmt = recipients.filter(r => r.isValid).reduce((s, r) => s + parseFloat(r.amount), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card space-y-5">
      {/* Mode Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Bulk Sender</h2>
        <div className="flex rounded-xl bg-white/5 p-1">
          <button onClick={() => setMode("native")} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${mode === "native" ? "bg-pink-500 text-white shadow-glow" : "text-neutral-400"}`}>Native DACC</button>
          <button onClick={() => setMode("erc20")} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${mode === "erc20" ? "bg-pink-500 text-white shadow-glow" : "text-neutral-400"}`}>ERC20 Token</button>
        </div>
      </div>

      {/* Token Address */}
      <AnimatePresence>
        {mode === "erc20" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <label className="mb-2 block text-sm text-neutral-400">Token Contract Address</label>
            <input type="text" value={tokenAddress} onChange={e => setTokenAddress(e.target.value)} placeholder="0x..." className="input-glass font-mono text-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Textarea with Drag & Drop */}
      <div onDragOver={e => { e.preventDefault(); setIsDrag(true); }} onDragLeave={e => { e.preventDefault(); setIsDrag(false); }} onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all ${isDrag ? "border-pink-500 bg-pink-500/5" : "border-white/10"}`}>
        <textarea value={input} onChange={e => setInput(e.target.value)} rows={7}
          placeholder={"Enter recipients (one per line):\naddress,amount\n\n0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28,0.01\n0x53d284357ec70cE289D6D64134DfAc8E511c8a3D,0.02\n\nOr drag & drop a CSV file here"}
          className="w-full resize-none rounded-2xl bg-transparent px-4 py-4 font-mono text-sm placeholder:text-neutral-600 focus:outline-none" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleValidate} disabled={!input.trim()} className="btn-secondary text-sm">Validate</button>
        <button onClick={() => fileRef.current?.click()} className="btn-ghost text-neutral-400 hover:text-pink-400">Upload CSV</button>
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
      </div>

      {/* Validation Results + Send Button */}
      {recipients.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-center"><p className="text-lg font-bold text-emerald-400">{validCount}</p><p className="text-xs text-neutral-500">Valid</p></div>
            <div className="rounded-xl bg-red-500/10 p-3 text-center"><p className="text-lg font-bold text-red-400">{recipients.filter(r => !r.isValid).length}</p><p className="text-xs text-neutral-500">Invalid</p></div>
            <div className="rounded-xl bg-yellow-500/10 p-3 text-center"><p className="text-lg font-bold text-yellow-400">{recipients.filter(r => r.isDuplicate).length}</p><p className="text-xs text-neutral-500">Duplicates</p></div>
            <div className="rounded-xl bg-pink-500/10 p-3 text-center"><p className="text-lg font-bold text-pink-400">{totalAmt.toFixed(4)}</p><p className="text-xs text-neutral-500">Total Amount</p></div>
          </div>

          {/* Preview Table */}
          <div className="max-h-44 overflow-y-auto rounded-xl border border-white/5">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0a0a1a]/95"><tr className="border-b border-white/5"><th className="px-3 py-2 text-left text-neutral-500">#</th><th className="px-3 py-2 text-left text-neutral-500">Address</th><th className="px-3 py-2 text-right text-neutral-500">Amount</th><th className="px-3 py-2 text-center text-neutral-500">Status</th></tr></thead>
              <tbody>
                {recipients.slice(0, 30).map((r, i) => (
                  <tr key={r.id} className="border-b border-white/5"><td className="px-3 py-2 text-neutral-500">{i+1}</td><td className="px-3 py-2 font-mono">{r.address.slice(0,8)}...{r.address.slice(-4)}</td><td className="px-3 py-2 text-right">{r.amount}</td><td className="px-3 py-2 text-center">{r.isValid ? <span className="status-success">Valid</span> : <span className="status-failed">{r.error}</span>}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* INFO: Single Transaction */}
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
            <p className="text-xs text-blue-400 font-medium">
              ⚡ ONE MetaMask confirmation → Smart contract sends to ALL {validCount} wallets in a single transaction
            </p>
          </div>

          {/* SEND BUTTON */}
          <button onClick={handleSend} disabled={validCount === 0 || isProcessing || !walletConnected} className="btn-primary w-full py-5 text-lg font-bold animate-pulse-pink">
            {!walletConnected ? "Connect Wallet First" : isProcessing ? (
              <span className="flex items-center justify-center gap-2"><svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Confirming Transaction...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                SEND {totalAmt.toFixed(4)} {mode === "native" ? DAC_NETWORK.currencySymbol : "Tokens"} to {validCount} Wallets (1 TX)
              </span>
            )}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
