"use client";
import { motion } from "framer-motion";
import { QueueState, TxStatus } from "@/types";
import { truncateAddress, getExplorerTxUrl, generateCSV, downloadCSV } from "@/utils";
import toast from "react-hot-toast";

interface Props { state: QueueState; }

export function TransactionHistory({ state }: Props) {
  const { transactions } = state;

  const handleExport = () => {
    if (transactions.length === 0) return;
    const csv = generateCSV(transactions);
    downloadCSV(csv, `dac-transactions-${Date.now()}.csv`);
    toast.success("CSV exported!");
  };

  if (transactions.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-12">
        <p className="text-neutral-500">No transactions yet. Send some tokens!</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Transaction History</h3>
        <button onClick={handleExport} className="btn-ghost text-sm text-pink-400">Export CSV</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white/5 p-3 text-center"><p className="text-lg font-bold">{transactions.length}</p><p className="text-xs text-neutral-500">Total</p></div>
        <div className="rounded-xl bg-emerald-500/10 p-3 text-center"><p className="text-lg font-bold text-emerald-400">{transactions.filter(t=>t.status===TxStatus.SUCCESS).length}</p><p className="text-xs text-neutral-500">Success</p></div>
        <div className="rounded-xl bg-red-500/10 p-3 text-center"><p className="text-lg font-bold text-red-400">{transactions.filter(t=>t.status===TxStatus.FAILED).length}</p><p className="text-xs text-neutral-500">Failed</p></div>
        <div className="rounded-xl bg-pink-500/10 p-3 text-center"><p className="text-lg font-bold text-pink-400">{transactions.filter(t=>t.status===TxStatus.SUCCESS).reduce((s,t)=>s+parseFloat(t.amount),0).toFixed(4)}</p><p className="text-xs text-neutral-500">Total Sent</p></div>
      </div>

      {/* Full List */}
      <div className="max-h-96 overflow-y-auto rounded-xl border border-white/5">
        {transactions.map(tx => (
          <div key={tx.id} className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs">{truncateAddress(tx.recipient, 8)}</p>
              <p className="text-xs text-neutral-500">{tx.amount} DACC • {new Date(tx.timestamp).toLocaleTimeString()}</p>
            </div>
            <div>{tx.status === TxStatus.SUCCESS ? <span className="status-success">Success</span> : tx.status === TxStatus.FAILED ? <span className="status-failed">Failed</span> : <span className="status-pending">{tx.status}</span>}</div>
            {tx.hash && <a href={getExplorerTxUrl(tx.hash)} target="_blank" rel="noopener noreferrer" className="text-pink-400 text-xs hover:text-pink-300">Explorer</a>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
