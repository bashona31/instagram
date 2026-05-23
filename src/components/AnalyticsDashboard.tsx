"use client";

import { motion } from "framer-motion";
import { QueueState } from "@/types";
import { formatBalance, formatNumber } from "@/utils";
import { generateCSVExport, downloadCSV } from "@/utils/csv";
import { StatCard } from "./ui/StatCard";
import { GlassCard } from "./ui/GlassCard";
import { DAC_NETWORK } from "@/lib/constants";

interface Props { queueState: QueueState; }

export function AnalyticsDashboard({ queueState }: Props) {
  const { totalTransactions, successCount, failedCount,
    totalAmountSent, totalGasUsed, transactions, isRunning } = queueState;
  if (totalTransactions === 0) return null;


  const handleExport = () => {
    const csv = generateCSVExport(transactions);
    downloadCSV(csv, `dac-bulk-send-${new Date().toISOString().split("T")[0]}.csv`);
  };

  return (
    <GlassCard className="space-y-5" delay={0.3}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Analytics</h3>
        <button onClick={handleExport} disabled={transactions.length === 0}
          className="btn-ghost text-sm text-pink-400 hover:bg-pink-500/10">Export CSV</button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>} label="Total Wallets" value={formatNumber(totalTransactions)} delay={0.1} />
        <StatCard icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} label="Total Sent" value={`${formatBalance(totalAmountSent, 4)} ${DAC_NETWORK.currencySymbol}`} delay={0.15} />
        <StatCard icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} label="Successful" value={formatNumber(successCount)} subtext={totalTransactions > 0 ? `${Math.round((successCount / totalTransactions) * 100)}%` : "0%"} delay={0.2} />

        <StatCard icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} label="Failed" value={formatNumber(failedCount)} subtext={totalTransactions > 0 ? `${Math.round((failedCount / totalTransactions) * 100)}%` : "0%"} delay={0.25} />
        <StatCard icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>} label="Success Rate" value={totalTransactions > 0 ? `${Math.round((successCount / (successCount + failedCount || 1)) * 100)}%` : "N/A"} delay={0.3} />
        <StatCard icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/></svg>} label="Gas Used" value={totalGasUsed !== "0" ? formatBalance((Number(totalGasUsed) / 1e9).toString(), 4) + " Gwei" : "0"} delay={0.35} />
      </div>

      {!isRunning && totalTransactions > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className={`rounded-xl p-4 text-center ${failedCount === 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-yellow-500/10 border border-yellow-500/20"}`}>
          <p className={`font-medium ${failedCount === 0 ? "text-emerald-400" : "text-yellow-400"}`}>
            {failedCount === 0 ? "All transactions completed successfully!" : `Completed with ${failedCount} failed transaction${failedCount > 1 ? "s" : ""}`}
          </p>
        </motion.div>
      )}
    </GlassCard>
  );
}
