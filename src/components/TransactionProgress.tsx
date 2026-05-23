"use client";
import { motion, AnimatePresence } from "framer-motion";
import { QueueState, TxStatus } from "@/types";
import { truncateAddress, getExplorerTxUrl } from "@/utils";

interface Props {
  state: QueueState;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export function TransactionProgress({ state, onPause, onResume, onCancel }: Props) {
  const { isRunning, isPaused, total, completed, success, failed, transactions, currentBatch, totalBatches } = state;
  if (total === 0) return null;

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Transaction Progress</h3>
        {isRunning && (
          <div className="flex gap-2">
            {isPaused
              ? <button onClick={onResume} className="btn-ghost text-emerald-400 text-sm">Resume</button>
              : <button onClick={onPause} className="btn-ghost text-yellow-400 text-sm">Pause</button>}
            <button onClick={onCancel} className="btn-ghost text-red-400 text-sm">Cancel</button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-1"><span className="text-neutral-400">Progress</span><span className="text-pink-400 font-medium">{pct}%</span></div>
        <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-pink-400" animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} style={{ boxShadow: "0 0 10px rgba(236,72,153,0.5)" }} />
        </div>
        <p className="mt-1 text-xs text-neutral-500">{completed} / {total} • Batch {currentBatch}/{totalBatches}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald-500/10 p-3 text-center"><p className="text-xl font-bold text-emerald-400">{success}</p><p className="text-xs text-neutral-500">Success</p></div>
        <div className="rounded-xl bg-red-500/10 p-3 text-center"><p className="text-xl font-bold text-red-400">{failed}</p><p className="text-xs text-neutral-500">Failed</p></div>
        <div className="rounded-xl bg-blue-500/10 p-3 text-center"><p className="text-xl font-bold text-blue-400">{total - completed}</p><p className="text-xs text-neutral-500">Remaining</p></div>
      </div>

      {/* TX List */}
      <div className="max-h-60 overflow-y-auto rounded-xl border border-white/5">
        <AnimatePresence mode="popLayout">
          {transactions.map(tx => (
            <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0">
              <div className="flex-shrink-0">
                {tx.status === TxStatus.SUCCESS && <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
                {tx.status === TxStatus.FAILED && <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>}
                {(tx.status === TxStatus.PROCESSING || tx.status === TxStatus.RETRYING) && <svg className="h-4 w-4 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                {tx.status === TxStatus.PENDING && <div className="h-4 w-4 rounded-full border-2 border-white/20"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs truncate">{truncateAddress(tx.recipient, 6)}</p>
                <p className="text-xs text-neutral-500">{tx.amount} DACC</p>
              </div>
              <div className="flex-shrink-0">
                {tx.status === TxStatus.SUCCESS && <span className="status-success">Success</span>}
                {tx.status === TxStatus.FAILED && <span className="status-failed">Failed</span>}
                {tx.status === TxStatus.PROCESSING && <span className="status-processing">Sending</span>}
                {tx.status === TxStatus.RETRYING && <span className="status-processing">Retry</span>}
                {tx.status === TxStatus.PENDING && <span className="status-pending">Pending</span>}
              </div>
              {tx.hash && (
                <a href={getExplorerTxUrl(tx.hash)} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
