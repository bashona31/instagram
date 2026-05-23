"use client";

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Recipient, SendMode } from "@/types";
import { parseRecipientsFromText, parseRecipientsFromCSV, getValidRecipients, calculateTotalAmount } from "@/utils/validation";
import { parseCSV, generateSampleCSV, downloadCSV } from "@/utils/csv";
import { GlassCard } from "./ui/GlassCard";

interface BulkSenderFormProps {
  onSubmit: (recipients: Recipient[], mode: SendMode, tokenAddress?: string) => void;
  isProcessing: boolean;
  walletConnected: boolean;
}

export function BulkSenderForm({ onSubmit, isProcessing, walletConnected }: BulkSenderFormProps) {
  const [mode, setMode] = useState<SendMode>("native");
  const [tokenAddress, setTokenAddress] = useState("");
  const [inputText, setInputText] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParse = useCallback(() => {
    if (!inputText.trim()) return;
    const parsed = parseRecipientsFromText(inputText);
    setRecipients(parsed);
    setShowPreview(true);
  }, [inputText]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const data = parseCSV(content);
      const parsed = parseRecipientsFromCSV(data);
      setRecipients(parsed);
      setInputText(parsed.map((r) => `${r.address},${r.amount}`).join("\n"));
      setShowPreview(true);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = (e: DragEvent) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f && (f.name.endsWith(".csv") || f.name.endsWith(".txt"))) handleFile(f); };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); };

  const handleSubmit = () => {
    const valid = getValidRecipients(recipients);
    if (valid.length === 0) return;
    onSubmit(valid, mode, mode === "erc20" ? tokenAddress : undefined);
  };

  const validCount = recipients.filter((r) => r.isValid).length;
  const invalidCount = recipients.filter((r) => !r.isValid).length;
  const duplicateCount = recipients.filter((r) => r.isDuplicate).length;
  const totalAmount = calculateTotalAmount(recipients);

  return (
    <GlassCard className="space-y-6" delay={0.1}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Bulk Sender</h2>
        <div className="flex rounded-xl bg-white/5 p-1">
          <button onClick={() => setMode("native")} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${mode === "native" ? "bg-pink-500 text-white shadow-glow" : "text-neutral-400 hover:text-white"}`}>Native DACC</button>
          <button onClick={() => setMode("erc20")} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${mode === "erc20" ? "bg-pink-500 text-white shadow-glow" : "text-neutral-400 hover:text-white"}`}>ERC20 Token</button>
        </div>
      </div>

      <AnimatePresence>
        {mode === "erc20" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <label className="mb-2 block text-sm text-neutral-400">Token Contract Address</label>
            <input type="text" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} placeholder="0x..." className="input-glass font-mono text-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all ${isDragOver ? "border-pink-500 bg-pink-500/5" : "border-white/10 hover:border-white/20"}`}
      >
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={"Enter recipients (one per line):\naddress,amount\n\n0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28,1.5\n0x53d284357ec70cE289D6D64134DfAc8E511c8a3D,2.0\n\nOr drag & drop a CSV file here"}
          rows={8}
          className="w-full resize-none rounded-2xl bg-transparent px-4 py-4 font-mono text-sm placeholder:text-neutral-600 focus:outline-none custom-scrollbar"
        />
        <AnimatePresence>
          {isDragOver && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center rounded-2xl bg-pink-500/10 backdrop-blur-sm">
              <p className="text-sm font-medium text-pink-400">Drop CSV file here</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleParse} disabled={!inputText.trim()} className="btn-secondary text-sm">Validate</button>
        <button onClick={() => fileInputRef.current?.click()} className="btn-ghost text-neutral-400 hover:text-pink-400">Upload CSV</button>
        <button onClick={() => { const s = generateSampleCSV(); downloadCSV(s, "sample.csv"); }} className="btn-ghost text-neutral-400 hover:text-pink-400">Sample CSV</button>
        <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" />
      </div>

      <AnimatePresence>
        {showPreview && recipients.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-center"><p className="text-lg font-bold text-emerald-400">{validCount}</p><p className="text-xs text-neutral-500">Valid</p></div>
              <div className="rounded-xl bg-red-500/10 p-3 text-center"><p className="text-lg font-bold text-red-400">{invalidCount}</p><p className="text-xs text-neutral-500">Invalid</p></div>
              <div className="rounded-xl bg-yellow-500/10 p-3 text-center"><p className="text-lg font-bold text-yellow-400">{duplicateCount}</p><p className="text-xs text-neutral-500">Duplicates</p></div>
              <div className="rounded-xl bg-pink-500/10 p-3 text-center"><p className="text-lg font-bold text-pink-400">{totalAmount}</p><p className="text-xs text-neutral-500">Total Amount</p></div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/5 custom-scrollbar">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#0a0a1a]/90 backdrop-blur-sm">
                  <tr className="border-b border-white/5"><th className="px-3 py-2 text-left text-neutral-500">#</th><th className="px-3 py-2 text-left text-neutral-500">Address</th><th className="px-3 py-2 text-right text-neutral-500">Amount</th><th className="px-3 py-2 text-center text-neutral-500">Status</th></tr>
                </thead>
                <tbody>
                  {recipients.slice(0, 50).map((r, i) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2 text-neutral-500">{i + 1}</td>
                      <td className="px-3 py-2 font-mono">{r.address.slice(0, 10)}...{r.address.slice(-6)}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.amount}</td>
                      <td className="px-3 py-2 text-center">{r.isValid ? <span className="status-success">Valid</span> : <span className="status-failed">{r.error}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recipients.length > 50 && <p className="p-2 text-center text-xs text-neutral-500">...and {recipients.length - 50} more</p>}
            </div>

            <button onClick={handleSubmit} disabled={validCount === 0 || isProcessing || !walletConnected} className="btn-primary w-full py-4 text-base">
              {!walletConnected ? "Connect Wallet First" : isProcessing ? "Processing..." : `Send to ${validCount} Recipients (${totalAmount} ${mode === "native" ? "DACC" : "Tokens"})`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
