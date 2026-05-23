import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "DAC Bulk Sender | Fast Multi-Wallet Token Distribution",
  description: "Advanced Web3 bulk sender for DAC Testnet. Send DACC and ERC20 tokens to hundreds of wallets simultaneously.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <div className="fixed inset-0 -z-10 animated-gradient-bg" />
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="absolute top-1/3 -left-20 h-60 w-60 rounded-full bg-pink-600/5 blur-3xl" />
          <div className="absolute bottom-20 right-1/4 h-40 w-40 rounded-full bg-pink-400/10 blur-3xl" />
        </div>
        <main className="relative min-h-screen">{children}</main>
      </body>
    </html>
  );
}
