"use client";

// ============================================================
// Footer Component
// ============================================================

import { DAC_NETWORK } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-white/5 py-6 text-center">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <p className="text-xs text-muted-foreground">
          DAC Bulk Sender &bull; Built for {DAC_NETWORK.networkName}
        </p>
        <div className="flex items-center gap-4">
          <a
            href={DAC_NETWORK.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground transition-colors hover:text-pink-400"
          >
            Explorer
          </a>
          <span className="text-xs text-muted-foreground">
            Chain ID: {DAC_NETWORK.chainId}
          </span>
        </div>
      </div>
    </footer>
  );
}
