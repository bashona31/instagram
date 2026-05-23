"use client";
/**
 * useTransactionQueue Hook - REAL blockchain transaction execution
 * 
 * CRITICAL: This hook actually sends transactions to the blockchain.
 * Each transaction triggers a MetaMask confirmation popup.
 * 
 * Flow per transaction:
 * 1. Get signer from useWallet hook
 * 2. Call signer.sendTransaction({ to, value }) - TRIGGERS METAMASK POPUP
 * 3. Wait for tx.wait() - waits for on-chain confirmation
 * 4. Get receipt with hash and gasUsed
 * 5. Update UI with real results
 * 
 * Batch processing:
 * - Process MAX_CONCURRENT_TXS transactions simultaneously
 * - Use Promise.allSettled for concurrent execution
 * - Retry failed transactions up to MAX_RETRY_ATTEMPTS times
 */

import { useState, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { TxRecord, TxStatus, QueueState, Recipient, SendMode } from "@/types";
import { MAX_CONCURRENT_TXS, MAX_RETRY_ATTEMPTS } from "@/lib/constants";
import { ERC20_ABI } from "@/contracts/abi";

const INITIAL_STATE: QueueState = {
  isRunning: false,
  isPaused: false,
  total: 0,
  completed: 0,
  success: 0,
  failed: 0,
  currentBatch: 0,
  totalBatches: 0,
  transactions: [],
};

export function useTransactionQueue() {
  const [state, setState] = useState<QueueState>(INITIAL_STATE);
  const pauseRef = useRef(false);
  const cancelRef = useRef(false);

  /**
   * SEND SINGLE NATIVE TRANSACTION
   * Uses explicit nonce so MetaMask only asks ONCE for the first tx,
   * then auto-signs the rest (since nonce increments automatically).
   * 
   * IMPORTANT: We pass explicit nonce to avoid "nonce too low" errors
   * when sending multiple txs concurrently.
   */
  const sendNativeTransaction = async (
    signer: ethers.JsonRpcSigner,
    to: string,
    amountEther: string,
    nonce: number
  ): Promise<{ hash: string; gasUsed: string }> => {
    console.log(`[TX] Sending ${amountEther} DACC to ${to} (nonce: ${nonce})...`);

    // Send with explicit nonce - MetaMask will batch approve these
    const tx = await signer.sendTransaction({
      to: to,
      value: ethers.parseEther(amountEther),
      nonce: nonce,
    });

    console.log(`[TX] TX submitted: ${tx.hash}`);

    // Wait for confirmation - use null to just wait for mining
    const receipt = await tx.wait();

    if (!receipt) throw new Error("Transaction receipt is null");

    console.log(`[TX] CONFIRMED! Hash: ${receipt.hash}, Gas: ${receipt.gasUsed.toString()}`);

    return {
      hash: receipt.hash,
      gasUsed: receipt.gasUsed.toString(),
    };
  };

  /**
   * SEND SINGLE ERC20 TRANSFER
   */
  const sendTokenTransaction = async (
    signer: ethers.JsonRpcSigner,
    tokenAddress: string,
    to: string,
    amountStr: string,
    decimals: number,
    nonce: number
  ): Promise<{ hash: string; gasUsed: string }> => {
    console.log(`[TX] Sending ${amountStr} tokens to ${to} (nonce: ${nonce})...`);

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const amount = ethers.parseUnits(amountStr, decimals);

    // Send with explicit nonce
    const tx = await contract.transfer(to, amount, { nonce });

    console.log(`[TX] Token TX submitted: ${tx.hash}`);

    const receipt = await tx.wait();
    if (!receipt) throw new Error("Token TX receipt is null");

    console.log(`[TX] Token TX CONFIRMED! Hash: ${receipt.hash}`);

    return {
      hash: receipt.hash,
      gasUsed: receipt.gasUsed.toString(),
    };
  };

  /**
   * Process single recipient with retry logic
   */
  const processOne = async (
    signer: ethers.JsonRpcSigner,
    recipient: Recipient,
    mode: SendMode,
    nonce: number,
    tokenAddress?: string,
    tokenDecimals?: number
  ): Promise<TxRecord> => {
    const record: TxRecord = {
      id: recipient.id,
      recipient: recipient.address,
      amount: recipient.amount,
      status: TxStatus.PROCESSING,
      retryCount: 0,
      timestamp: Date.now(),
    };

    // Update status to processing
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t =>
        t.id === record.id ? { ...t, status: TxStatus.PROCESSING } : t
      ),
    }));

    let lastError: string = "";

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        // Check pause/cancel
        while (pauseRef.current) {
          await new Promise(r => setTimeout(r, 500));
        }
        if (cancelRef.current) {
          record.status = TxStatus.CANCELLED;
          return record;
        }

        // Retry delay with exponential backoff
        if (attempt > 0) {
          console.log(`[TX] Retry #${attempt} for ${recipient.address}...`);
          setState(prev => ({
            ...prev,
            transactions: prev.transactions.map(t =>
              t.id === record.id ? { ...t, status: TxStatus.RETRYING, retryCount: attempt } : t
            ),
          }));
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }

        // EXECUTE THE ACTUAL TRANSACTION
        let result: { hash: string; gasUsed: string };

        if (mode === "native") {
          result = await sendNativeTransaction(signer, recipient.address, recipient.amount, nonce);
        } else {
          if (!tokenAddress || tokenDecimals === undefined) {
            throw new Error("Token address and decimals required");
          }
          result = await sendTokenTransaction(signer, tokenAddress, recipient.address, recipient.amount, tokenDecimals, nonce);
        }

        // SUCCESS!
        record.hash = result.hash;
        record.gasUsed = result.gasUsed;
        record.status = TxStatus.SUCCESS;

        setState(prev => ({
          ...prev,
          success: prev.success + 1,
          completed: prev.completed + 1,
          transactions: prev.transactions.map(t =>
            t.id === record.id ? { ...record } : t
          ),
        }));

        return record;

      } catch (err: any) {
        lastError = err?.message || err?.reason || "Transaction failed";
        console.error(`[TX] Attempt ${attempt + 1} failed for ${recipient.address}:`, lastError);
      }
    }

    // ALL RETRIES FAILED
    record.status = TxStatus.FAILED;
    record.error = lastError;

    setState(prev => ({
      ...prev,
      failed: prev.failed + 1,
      completed: prev.completed + 1,
      transactions: prev.transactions.map(t =>
        t.id === record.id ? { ...record } : t
      ),
    }));

    return record;
  };

  /**
   * START PROCESSING - Main entry point
   * Takes a signer and list of recipients, processes them in batches
   */
  const startProcessing = useCallback(async (
    signer: ethers.JsonRpcSigner,
    recipients: Recipient[],
    mode: SendMode,
    tokenAddress?: string,
    tokenDecimals?: number
  ) => {
    console.log(`[Queue] Starting processing: ${recipients.length} recipients, mode: ${mode}`);

    pauseRef.current = false;
    cancelRef.current = false;

    const totalBatches = Math.ceil(recipients.length / MAX_CONCURRENT_TXS);

    // Initialize all transactions as pending
    const initialTxs: TxRecord[] = recipients.map(r => ({
      id: r.id,
      recipient: r.address,
      amount: r.amount,
      status: TxStatus.PENDING,
      retryCount: 0,
      timestamp: Date.now(),
    }));

    setState({
      isRunning: true,
      isPaused: false,
      total: recipients.length,
      completed: 0,
      success: 0,
      failed: 0,
      currentBatch: 0,
      totalBatches,
      transactions: initialTxs,
    });

    // Process in batches
    // Get starting nonce ONCE - then increment for each tx
    // This way MetaMask only asks for approval once, then all txs go through
    const startingNonce = await signer.getNonce();
    console.log(`[Queue] Starting nonce: ${startingNonce}`);

    let nonceCounter = startingNonce;

    for (let i = 0; i < recipients.length; i += MAX_CONCURRENT_TXS) {
      if (cancelRef.current) break;

      const batch = recipients.slice(i, i + MAX_CONCURRENT_TXS);
      const batchNum = Math.floor(i / MAX_CONCURRENT_TXS) + 1;

      console.log(`[Queue] Processing batch ${batchNum}/${totalBatches} (${batch.length} txs)...`);

      setState(prev => ({ ...prev, currentBatch: batchNum }));

      // Process batch concurrently - each gets its own nonce
      const batchPromises = batch.map((recipient, idx) => {
        const txNonce = nonceCounter + idx;
        return processOne(signer, recipient, mode, txNonce, tokenAddress, tokenDecimals);
      });

      await Promise.allSettled(batchPromises);

      // Increment nonce counter by batch size
      nonceCounter += batch.length;

      // Small delay between batches to avoid RPC overload
      if (i + MAX_CONCURRENT_TXS < recipients.length && !cancelRef.current) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    setState(prev => ({ ...prev, isRunning: false }));
    console.log("[Queue] Processing complete!");
  }, []); // eslint-disable-line

  const pause = useCallback(() => {
    pauseRef.current = true;
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    pauseRef.current = false;
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    pauseRef.current = false;
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      transactions: prev.transactions.map(t =>
        t.status === TxStatus.PENDING || t.status === TxStatus.PROCESSING
          ? { ...t, status: TxStatus.CANCELLED }
          : t
      ),
    }));
  }, []);

  const reset = useCallback(() => {
    pauseRef.current = false;
    cancelRef.current = false;
    setState(INITIAL_STATE);
  }, []);

  return { state, startProcessing, pause, resume, cancel, reset };
}
