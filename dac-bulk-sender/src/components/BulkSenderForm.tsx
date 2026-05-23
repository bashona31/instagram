"use client";

// ============================================================
// BulkSenderForm Component - Main form for inputting recipients
// Supports manual input, CSV upload, drag & drop
// ============================================================

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

  // Parse input text into recipients
  const handleParseInput = useCallback(() => {
    if (!inputText.trim()) return;
    const parsed = parseRecipientsFromText(inputText);
    setRecipients(parsed);
    setShowPreview(true);
  }, [inputText]);

  // Handle CSV file upload
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const csvData = parseCSV(content);
      const parsed = parseRecipientsFromCSV(csvData);
      setRecipients(parsed);
      setInputText(
        parsed.map((r) => `${r.address},${r.amount}`).join("\n")
      );
      setShowPreview(true);
    };
    reader.readAsText(file);
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".txt"))) {
      handleFileUpload(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Submit form
  const handleSubmit = () => {
    const validRecipients = getValidRecipients(recipients);
    if (validRecipients.length === 0) return;
    onSubmit(validRecipients, mode, mode === "erc20" ? tokenAddress : undefined);
  };

  // Download sample CSV
  const handleDownloadSample = () => {
    const sample = generateSampleCSV();
    downloadCSV(sample, "sample-bulk-send.csv");
  };

  const validCount = recipients.filter((r) => r.isValid).length;
  const invalidCount = recipients.filter((r) => !r.isValid).length;
  const duplicateCount = recipients.filter((r) => r.isDuplicate).length;
  const totalAmount = calculateTotalAmount(recipients);

  return (
    <GlassCard className="space-y-6" delay={0.1}>
      {/* Mode Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-foreground">Bulk Sender</h2>
        <div className="flex rounded-xl bg-white/5 p-1">
          <button
            onClick={() => setMode("native")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              mode === "native"
                ? "bg-pink-500 text-white shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Native DACC
          </button>
          <button
            onClick={() => setMode("erc20")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              mode === "erc20"
                ? "bg-pink-500 text-white shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ERC20 Token
          </button>
        </div>
      </div>

      {/* ERC20 Token Address Input */}
      <AnimatePresence>
        {mode === "erc20" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label className="mb-2 block text-sm font-medium text-muted-foreground">
              Token Contract Address
            </label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x..."
              className="input-glass font-mono text-sm"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area with Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
          isDragOver
            ? "border-pink-500 bg-pink-500/5"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Enter recipients (one per line):\naddress,amount\n\n0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28,1.5\n0x53d284357ec70cE289D6D64134DfAc8E511c8a3D,2.0\n\nOr drag & drop a CSV file here`}
          rows={8}
          className="w-full resize-none rounded-2xl bg-transparent px-4 py-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none custom-scrollbar"
        />

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-pink-500/10 backdrop-blur-sm"
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm font-medium text-pink-400">Drop CSV file here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions Row */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleParseInput}
          disabled={!inputText.trim()}
          className="btn-secondary text-sm"
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Validate
          </span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-ghost text-muted-foreground hover:text-pink-400"
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload CSV
          </span>
        </button>

        <button
          onClick={handleDownloadSample}
          className="btn-ghost text-muted-foreground hover:text-pink-400"
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Sample CSV
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Preview / Validation Results */}
      <AnimatePresence>
        {showPreview && recipients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                <p className="text-lg font-bold text-emerald-400">{validCount}</p>
                <p className="text-xs text-muted-foreground">Valid</p>
              </div>
              <div className="rounded-xl bg-red-500/10 p-3 text-center">
                <p className="text-lg font-bold text-red-400">{invalidCount}</p>
                <p className="text-xs text-muted-foreground">Invalid</p>
              </div>
              <div className="rounded-xl bg-yellow-500/10 p-3 text-center">
                <p className="text-lg font-bold text-yellow-400">{duplicateCount}</p>
                <p className="text-xs text-muted-foreground">Duplicates</p>
              </div>
              <div className="rounded-xl bg-pink-500/10 p-3 text-center">
                <p className="text-lg font-bold text-pink-400">{totalAmount}</p>
                <p className="text-xs text-muted-foreground">Total Amount</p>
              </div>
            </div>

            {/* Recipients Preview Table */}
            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/5 custom-scrollbar">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background/80 backdrop-blur-sm">
                  <tr className="border-b border-white/5">
                    <th className="px-3 py-2 text-left text-muted-foreground">#</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Address</th>
                    <th className="px-3 py-2 text-right text-muted-foreground">Amount</th>
                    <th className="px-3 py-2 text-center text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.slice(0, 50).map((r, i) => (
                    <tr
                      key={r.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-mono text-foreground">
                        {r.address.slice(0, 10)}...{r.address.slice(-6)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-foreground">
                        {r.amount}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {r.isValid ? (
                          <span className="status-success">Valid</span>
                        ) : (
                          <span className="status-failed" title={r.error}>
                            {r.error || "Invalid"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recipients.length > 50 && (
                <p className="p-2 text-center text-xs text-muted-foreground">
                  ... and {recipients.length - 50} more recipients
                </p>
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={validCount === 0 || isProcessing || !walletConnected}
              className="btn-primary w-full py-4 text-base"
            >
              {!walletConnected ? (
                "Connect Wallet First"
              ) : isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Send to {validCount} Recipients ({totalAmount} {mode === "native" ? "DACC" : "Tokens"})
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
