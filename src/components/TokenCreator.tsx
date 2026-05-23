"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import { TokenConfig, DeployedToken } from "@/types";
import { deployToken } from "@/services/tokenDeployer";
import { getExplorerAddrUrl, getExplorerTxUrl, copyToClipboard } from "@/utils";
import toast from "react-hot-toast";

interface Props {
  getSigner: () => Promise<ethers.JsonRpcSigner>;
  walletConnected: boolean;
}

export function TokenCreator({ getSigner, walletConnected }: Props) {
  const [config, setConfig] = useState<TokenConfig>({
    name: "", symbol: "", supply: "1000000", decimals: 18,
    mintable: true, burnable: true, pausable: true,
  });
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState<DeployedToken | null>(null);

  const handleDeploy = async () => {
    if (!config.name || !config.symbol || !config.supply) {
      toast.error("Fill all fields"); return;
    }
    setDeploying(true);
    try {
      const signer = await getSigner();
      console.log("[TokenCreator] Got signer, deploying...");
      toast.loading("Deploying token... Confirm in MetaMask", { id: "deploy" });
      const result = await deployToken(signer, config);
      toast.dismiss("deploy");
      toast.success(`Token deployed at ${result.address.slice(0,10)}...`);
      setDeployed(result);
    } catch (err: any) {
      toast.dismiss("deploy");
      toast.error(err?.message || "Deployment failed");
      console.error("[TokenCreator] Deploy error:", err);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card space-y-5">
      <h2 className="text-xl font-bold">Create ERC20 Token</h2>
      <p className="text-sm text-neutral-400">Deploy your own token on DAC Testnet</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Token Name</label>
          <input value={config.name} onChange={e => setConfig(p => ({...p, name: e.target.value}))}
            placeholder="My Token" className="input-glass" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Symbol</label>
          <input value={config.symbol} onChange={e => setConfig(p => ({...p, symbol: e.target.value}))}
            placeholder="MTK" className="input-glass" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Total Supply</label>
          <input value={config.supply} onChange={e => setConfig(p => ({...p, supply: e.target.value}))}
            placeholder="1000000" className="input-glass" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Decimals</label>
          <input type="number" value={config.decimals}
            onChange={e => setConfig(p => ({...p, decimals: parseInt(e.target.value)||18}))}
            className="input-glass" />
        </div>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-3">
        {["mintable","burnable","pausable"].map(feat => (
          <label key={feat} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 cursor-pointer">
            <input type="checkbox" checked={(config as any)[feat]}
              onChange={e => setConfig(p => ({...p, [feat]: e.target.checked}))}
              className="accent-pink-500" />
            <span className="text-sm capitalize text-neutral-300">{feat}</span>
          </label>
        ))}
      </div>

      {/* Deploy Button */}
      <button onClick={handleDeploy} disabled={deploying || !walletConnected}
        className="btn-primary w-full py-4 text-base font-bold">
        {!walletConnected ? "Connect Wallet First" : deploying ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Deploying... Confirm in MetaMask
          </span>
        ) : "Deploy Token"}
      </button>

      {/* Deployed Result */}
      {deployed && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-3">
          <p className="font-bold text-emerald-400">Token Deployed Successfully!</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Contract:</span>
              <div className="flex items-center gap-2">
                <code className="text-emerald-300 font-mono text-xs">{deployed.address.slice(0,20)}...</code>
                <button onClick={() => { copyToClipboard(deployed.address); toast.success("Copied!"); }}
                  className="text-pink-400 hover:text-pink-300 text-xs">Copy</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Name:</span>
              <span>{deployed.name} ({deployed.symbol})</span>
            </div>
            <div className="flex gap-3 mt-2">
              <a href={getExplorerAddrUrl(deployed.address)} target="_blank" rel="noopener noreferrer"
                className="btn-ghost text-pink-400 text-xs">View Contract</a>
              <a href={getExplorerTxUrl(deployed.txHash)} target="_blank" rel="noopener noreferrer"
                className="btn-ghost text-pink-400 text-xs">View TX</a>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
