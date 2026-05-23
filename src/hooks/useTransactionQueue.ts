"use client";

// ============================================================
// useTransactionQueue Hook - Manages transaction processing
// Handles concurrent processing, retries, pause/resume
// ============================================================

import { useState, useCallback, useRef } from "react";
import { ethers } from "ethers";
import {
  TransactionRecord,
  TransactionStatus,
  QueueState,
  Recipient,
  SendMode,
} from "@/types";
import {
  MAX_CONCURRENT_TXS,
  MAX_RETRY_ATTEMPTS,
  DAC_NETWORK,
  GAS_BUFFER_MULTIPLIER,
} from "@/lib/constants";
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

  /**
   * Process a single native transfer
   */
  const processNativeTransfer = async (
    signer: ethers.Signer,
    recipient: string,
    amount: string
  ): Promise<{ hash: string; gasUsed: string }> => {
    const tx = await signer.sendTransaction({
      to: recipient,
      value: ethers.parseEther(amount),
      gasLimit: 21000n * BigInt(Math.ceil(GAS_BUFFER_MULTIPLIER * 100)) / 100n,
    });

    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction receipt is null");

    return {
      hash: receipt.hash,
      gasUsed: receipt.gasUsed.toString(),
    };
  };

  /**
   * Process a single ERC20 transfer
   */
  const processTokenTransfer = async (
    signer: ethers.Signer,
    tokenAddress: string,
    recipient: string,
    amount: string,
    decimals: number
  ): Promise<{ hash: string; gasUsed: string }> => {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const parsedAmount = ethers.parseUnits(amount, decimals);

    const tx = await tokenContract.transfer(recipient, parsedAmount);
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction receipt is null");

    return {
      hash: receipt.hash,
      gasUsed: receipt.gasUsed.toString(),
    };
  };

  /**
   * Process a single transaction with retry logic
   */
  const processTransaction = async (
    signer: ethers.Signer,
    recipient: Recipient,
    mode: SendMode,
    tokenAddress?: string,
    tokenDecimals?: number
  ): Promise<TransactionRecord> => {
    const record: TransactionRecord = {
      id: recipient.id,
      recipient: recipient.address,
      amount: recipient.amount,
      status: TransactionStatus.PROCESSING,
      retryCount: 0,
      timestamp: Date.now(),
    };

    // Update status to processing
    setQueueState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === record.id ? { ...t, status: TransactionStatus.PROCESSING } : t
      ),
    }));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        // Check if paused or cancelled
        while (isPausedRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        if (isCancelledRef.current) {
          record.status = TransactionStatus.CANCELLED;
          return record;
        }

        if (attempt > 0) {
          record.retryCount = attempt;
          record.status = TransactionStatus.RETRYING;
          setQueueState((prev) => ({
            ...prev,
            transactions: prev.transactions.map((t) =>
              t.id === record.id
                ? { ...t, status: TransactionStatus.RETRYING, retryCount: attempt }
                : t
            ),
          }));
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 10000))
          );
        }

        let result: { hash: string; gasUsed: string };

        if (mode === "native") {
          result = await processNativeTransfer(
            signer,
            recipient.address,
            recipient.amount
          );
        } else {
          if (!tokenAddress || tokenDecimals === undefined) {
            throw new Error("Token address and decimals required for ERC20 transfers");
          }
          result = await processTokenTransfer(
            signer,
            tokenAddress,
            recipient.address,
            recipient.amount,
            tokenDecimals
          );
        }

        record.hash = result.hash;
        record.gasUsed = result.gasUsed;
        record.status = TransactionStatus.SUCCESS;

        // Update success in state
        setQueueState((prev) => ({
          ...prev,
          successCount: prev.successCount + 1,
          completedTransactions: prev.completedTransactions + 1,
          totalGasUsed: (
            BigInt(prev.totalGasUsed || "0") + BigInt(result.gasUsed)
          ).toString(),
          totalAmountSent: (
            parseFloat(prev.totalAmountSent) + parseFloat(recipient.amount)
          ).toString(),
          transactions: prev.transactions.map((t) =>
            t.id === record.id
              ? { ...t, ...record }
              : t
          ),
        }));

        return record;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `Transaction attempt ${attempt + 1} failed for ${recipient.address}:`,
          error
        );
      }
    }

    // All retries failed
    record.status = TransactionStatus.FAILED;
    record.error = lastError?.message || "Unknown error";

    setQueueState((prev) => ({
      ...prev,
      failedCount: prev.failedCount + 1,
      completedTransactions: prev.completedTransactions + 1,
      transactions: prev.transactions.map((t) =>
        t.id === record.id ? { ...t, ...record } : t
      ),
    }));

    return record;
  };

  /**
   * Start processing all transactions
   */
  const startProcessing = useCallback(
    async (
      signer: ethers.Signer,
      recipients: Recipient[],
      mode: SendMode,
      tokenAddress?: string,
      tokenDecimals?: number
    ) => {
      isPausedRef.current = false;
      isCancelledRef.current = false;

      const totalBatches = Math.ceil(recipients.length / MAX_CONCURRENT_TXS);

      // Initialize all transactions as pending
      const initialTransactions: TransactionRecord[] = recipients.map((r) => ({
        id: r.id,
        recipient: r.address,
        amount: r.amount,
        status: TransactionStatus.PENDING,
        retryCount: 0,
        timestamp: Date.now(),
      }));

      setQueueState({
        isRunning: true,
        isPaused: false,
        totalTransactions: recipients.length,
        completedTransactions: 0,
        successCount: 0,
        failedCount: 0,
        currentBatch: 0,
        totalBatches,
        estimatedGas: (21000 * recipients.length).toString(),
        totalAmountSent: "0",
        totalGasUsed: "0",
        transactions: initialTransactions,
      });

      // Process in batches of MAX_CONCURRENT_TXS
      for (let i = 0; i < recipients.length; i += MAX_CONCURRENT_TXS) {
        if (isCancelledRef.current) break;

        const batch = recipients.slice(i, i + MAX_CONCURRENT_TXS);
        const batchNumber = Math.floor(i / MAX_CONCURRENT_TXS) + 1;

        setQueueState((prev) => ({
          ...prev,
          currentBatch: batchNumber,
        }));

        // Process batch concurrently
        await Promise.allSettled(
          batch.map((recipient) =>
            processTransaction(signer, recipient, mode, tokenAddress, tokenDecimals)
          )
        );

        // Small delay between batches for rate limiting
        if (i + MAX_CONCURRENT_TXS < recipients.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      setQueueState((prev) => ({
        ...prev,
        isRunning: false,
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /**
   * Pause transaction processing
   */
  const pause = useCallback(() => {
    isPausedRef.current = true;
    setQueueState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  /**
   * Resume transaction processing
   */
  const resume = useCallback(() => {
    isPausedRef.current = false;
    setQueueState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  /**
   * Cancel all remaining transactions
   */
  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    isPausedRef.current = false;
    setQueueState((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      transactions: prev.transactions.map((t) =>
        t.status === TransactionStatus.PENDING ||
        t.status === TransactionStatus.PROCESSING
          ? { ...t, status: TransactionStatus.CANCELLED }
          : t
      ),
    }));
  }, []);

  /**
   * Reset queue state
   */
  const reset = useCallback(() => {
    isPausedRef.current = false;
    isCancelledRef.current = false;
    setQueueState(initialQueueState);
  }, []);

  /**
   * Estimate total gas for transactions
   */
  const estimateGas = useCallback(
    async (
      provider: ethers.BrowserProvider,
      recipients: Recipient[],
      mode: SendMode
    ) => {
      try {
        const gasPerTx = mode === "native" ? 21000n : 65000n;
        const gasPrice = (await provider.getFeeData()).gasPrice || 0n;
        const totalGas = gasPerTx * BigInt(recipients.length);
        const totalCost = totalGas * gasPrice;

        return {
          totalGas: totalGas.toString(),
          gasCost: ethers.formatEther(totalCost),
          gasPrice: gasPrice.toString(),
        };
      } catch (error) {
        console.error("Gas estimation failed:", error);
        return { totalGas: "0", gasCost: "0", gasPrice: "0" };
      }
    },
    []
  );

  return {
    queueState,
    startProcessing,
    pause,
    resume,
    cancel,
    reset,
    estimateGas,
  };
}
