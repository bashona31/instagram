"use client";

import { useState, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { TransactionRecord, TransactionStatus, QueueState, Recipient, SendMode } from "@/types";
import { MAX_CONCURRENT_TXS, MAX_RETRY_ATTEMPTS, GAS_BUFFER_MULTIPLIER } from "@/lib/constants";
import { ERC20_ABI } from "@/contracts/abi";

const initialQueueState: QueueState = {
  isRunning: false,
  isPaused: false,
  totalTransactions: 0,
  completedTransactions: 0,
  successCount: 0,
  failedCount: 0,
  currentBatch: 0,
  totalBatches: 0,
  estimatedGas: "0",
  totalAmountSent: "0",
  totalGasUsed: "0",
  transactions: [],
};

export function useTransactionQueue() {
  const [queueState, setQueueState] = useState<QueueState>(initialQueueState);
  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);

  const processNativeTransfer = async (signer: ethers.Signer, recipient: string, amount: string) => {
    const tx = await signer.sendTransaction({
      to: recipient,
      value: ethers.parseEther(amount),
    });
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Receipt is null");
    return { hash: receipt.hash, gasUsed: receipt.gasUsed.toString() };
  };

  const processTokenTransfer = async (signer: ethers.Signer, tokenAddress: string, recipient: string, amount: string, decimals: number) => {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await contract.transfer(recipient, ethers.parseUnits(amount, decimals));
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Receipt is null");
    return { hash: receipt.hash, gasUsed: receipt.gasUsed.toString() };
  };

  const processTransaction = async (signer: ethers.Signer, recipient: Recipient, mode: SendMode, tokenAddress?: string, tokenDecimals?: number): Promise<TransactionRecord> => {
    const record: TransactionRecord = {
      id: recipient.id,
      recipient: recipient.address,
      amount: recipient.amount,
      status: TransactionStatus.PROCESSING,
      retryCount: 0,
      timestamp: Date.now(),
    };

    setQueueState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => t.id === record.id ? { ...t, status: TransactionStatus.PROCESSING } : t),
    }));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        while (isPausedRef.current) await new Promise((r) => setTimeout(r, 500));
        if (isCancelledRef.current) { record.status = TransactionStatus.CANCELLED; return record; }

        if (attempt > 0) {
          setQueueState((prev) => ({
            ...prev,
            transactions: prev.transactions.map((t) => t.id === record.id ? { ...t, status: TransactionStatus.RETRYING, retryCount: attempt } : t),
          }));
          await new Promise((r) => setTimeout(r, Math.min(1000 * Math.pow(2, attempt), 10000)));
        }

        let result: { hash: string; gasUsed: string };
        if (mode === "native") {
          result = await processNativeTransfer(signer, recipient.address, recipient.amount);
        } else {
          if (!tokenAddress || tokenDecimals === undefined) throw new Error("Token config required");
          result = await processTokenTransfer(signer, tokenAddress, recipient.address, recipient.amount, tokenDecimals);
        }

        record.hash = result.hash;
        record.gasUsed = result.gasUsed;
        record.status = TransactionStatus.SUCCESS;

        setQueueState((prev) => ({
          ...prev,
          successCount: prev.successCount + 1,
          completedTransactions: prev.completedTransactions + 1,
          totalGasUsed: (BigInt(prev.totalGasUsed || "0") + BigInt(result.gasUsed)).toString(),
          totalAmountSent: (parseFloat(prev.totalAmountSent) + parseFloat(recipient.amount)).toString(),
          transactions: prev.transactions.map((t) => t.id === record.id ? { ...t, ...record } : t),
        }));
        return record;
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    record.status = TransactionStatus.FAILED;
    record.error = lastError?.message || "Unknown error";
    setQueueState((prev) => ({
      ...prev,
      failedCount: prev.failedCount + 1,
      completedTransactions: prev.completedTransactions + 1,
      transactions: prev.transactions.map((t) => t.id === record.id ? { ...t, ...record } : t),
    }));
    return record;
  };

  const startProcessing = useCallback(async (signer: ethers.Signer, recipients: Recipient[], mode: SendMode, tokenAddress?: string, tokenDecimals?: number) => {
    isPausedRef.current = false;
    isCancelledRef.current = false;
    const totalBatches = Math.ceil(recipients.length / MAX_CONCURRENT_TXS);
    const initialTxs: TransactionRecord[] = recipients.map((r) => ({
      id: r.id, recipient: r.address, amount: r.amount, status: TransactionStatus.PENDING, retryCount: 0, timestamp: Date.now(),
    }));

    setQueueState({
      isRunning: true, isPaused: false, totalTransactions: recipients.length, completedTransactions: 0,
      successCount: 0, failedCount: 0, currentBatch: 0, totalBatches,
      estimatedGas: (21000 * recipients.length).toString(), totalAmountSent: "0", totalGasUsed: "0", transactions: initialTxs,
    });

    for (let i = 0; i < recipients.length; i += MAX_CONCURRENT_TXS) {
      if (isCancelledRef.current) break;
      const batch = recipients.slice(i, i + MAX_CONCURRENT_TXS);
      setQueueState((prev) => ({ ...prev, currentBatch: Math.floor(i / MAX_CONCURRENT_TXS) + 1 }));
      await Promise.allSettled(batch.map((r) => processTransaction(signer, r, mode, tokenAddress, tokenDecimals)));
      if (i + MAX_CONCURRENT_TXS < recipients.length) await new Promise((r) => setTimeout(r, 500));
    }

    setQueueState((prev) => ({ ...prev, isRunning: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pause = useCallback(() => { isPausedRef.current = true; setQueueState((p) => ({ ...p, isPaused: true })); }, []);
  const resume = useCallback(() => { isPausedRef.current = false; setQueueState((p) => ({ ...p, isPaused: false })); }, []);
  const cancel = useCallback(() => {
    isCancelledRef.current = true; isPausedRef.current = false;
    setQueueState((p) => ({ ...p, isRunning: false, isPaused: false,
      transactions: p.transactions.map((t) => (t.status === TransactionStatus.PENDING || t.status === TransactionStatus.PROCESSING) ? { ...t, status: TransactionStatus.CANCELLED } : t),
    }));
  }, []);
  const reset = useCallback(() => { isPausedRef.current = false; isCancelledRef.current = false; setQueueState(initialQueueState); }, []);

  return { queueState, startProcessing, pause, resume, cancel, reset };
}
