"use client";

// ============================================================
// TransactionProgress Component - Live transaction monitoring
// Shows progress bar, transaction list, pause/resume controls
// ============================================================

import { motion, AnimatePresence } from "framer-motion";
import { QueueState, TransactionStatus } from "@/types";
import { truncateAddress, getExplorerTxUrl, formatTimestamp } from "@/utils";
import { DAC_NETWORK } from "@/lib/constants";
import { GlassCard } from "./ui/GlassCard";
import { ProgressBar } from "./ui/ProgressBar";

interface TransactionProgressProps {
  queueState: QueueState;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export function TransactionProgress({
  queueState,
  onPause,
  onResume,
  onCancel,
}: TransactionProgressProps) {
  const { isRunning, isPaused, totalTransactions, completedTransactions, successCount, failedCount, transactions } = queueState;

  if (totalTransactions === 0) return null;

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return (
          <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case TransactionStatus.FAILED:
        return (
          <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case TransactionStatus.PROCESSING:
      case TransactionStatus.RETRYING:
        return (
          <svg className="h-4 w-4 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        );
      case TransactionStatus.CANCELLED:
        return (
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      default:
        return (
          <div className="h-4 w-4 rounded-full border-2 border-white/20" />
        );
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return <span className="status-success">Success</span>;
      case TransactionStatus.FAILED:
        return <span className="status-failed">Failed</span>;
      case TransactionStatus.PROCESSING:
        return <span className="status-processing">Processing</span>;
      case TransactionStatus.RETRYING:
        return <span className="status-processing">Retrying</span>;
      case TransactionStatus.CANCELLED:
        return <span className="rounded-full bg-gray-500/20 px-2.5 py-0.5 text-xs font-medium text-gray-400">Cancelled</span>;
      default:
        return <span className="status-pending">Pending</span>;
    }
  };

  return (
    <GlassCard className="space-y-5" delay={0.2}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">
          Transaction Progress
        </h3>
        <div className="flex items-center gap-2">
          {isRunning && (
            <>
              {isPaused ? (
                <button onClick={onResume} className="btn-ghost text-emerald-400 hover:bg-emerald-500/10">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Resume
                  </span>
                </button>
              ) : (
                <button onClick={onPause} className="btn-ghost text-yellow-400 hover:bg-yellow-500/10">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                    Pause
                  </span>
                </button>
              )}
              <button onClick={onCancel} className="btn-ghost text-red-400 hover:bg-red-500/10">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar value={completedTransactions} max={totalTransactions} />

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
          <p className="text-xl font-bold text-emerald-400">{successCount}</p>
          <p className="text-xs text-muted-foreground">Successful</p>
        </div>
        <div className="rounded-xl bg-red-500/10 p-3 text-center">
          <p className="text-xl font-bold text-red-400">{failedCount}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
        <div className="rounded-xl bg-blue-500/10 p-3 text-center">
          <p className="text-xl font-bold text-blue-400">
            {totalTransactions - completedTransactions}
          </p>
          <p className="text-xs text-muted-foreground">Remaining</p>
        </div>
      </div>

      {/* Batch Info */}
      {isRunning && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Batch {queueState.currentBatch} of {queueState.totalBatches}
          </span>
          {isPaused && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="font-medium text-yellow-400"
            >
              PAUSED
            </motion.span>
          )}
        </div>
      )}

      {/* Transaction List */}
      <div className="max-h-64 overflow-y-auto rounded-xl border border-white/5 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0"
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">{getStatusIcon(tx.status)}</div>

              {/* Recipient */}
              <div className="flex-1 min-w-0">
                <p className="truncate font-mono text-xs text-foreground">
                  {truncateAddress(tx.recipient, 6)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tx.amount} DACC
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">{getStatusBadge(tx.status)}</div>

              {/* TX Hash Link */}
              {tx.hash && (
                <a
                  href={getExplorerTxUrl(DAC_NETWORK.explorerUrl, tx.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-pink-400 transition-colors hover:text-pink-300"
                  title="View on Explorer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
