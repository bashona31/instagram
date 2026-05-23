"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { WalletState } from "@/types";
import { DAC_NETWORK } from "@/lib/constants";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  balance: "0",
  chainId: null,
  isCorrectNetwork: false,
  provider: null,
};

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(initialState);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const isMetaMaskAvailable = typeof window !== "undefined" && !!window.ethereum;

  const fetchBalance = useCallback(async (address: string, bp: ethers.BrowserProvider) => {
    try {
      const balance = await bp.getBalance(address);
      return ethers.formatEther(balance);
    } catch {
      return "0";
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: DAC_NETWORK.chainIdHex }],
      });
      return true;
    } catch (err: any) {
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: DAC_NETWORK.chainIdHex,
              chainName: DAC_NETWORK.networkName,
              nativeCurrency: { name: DAC_NETWORK.currencySymbol, symbol: DAC_NETWORK.currencySymbol, decimals: 18 },
              rpcUrls: [DAC_NETWORK.rpcUrl],
              blockExplorerUrls: [DAC_NETWORK.explorerUrl],
            }],
          });
          return true;
        } catch { return false; }
      }
      return false;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed");
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) throw new Error("No accounts found");

      const address = accounts[0];
      const bp = new ethers.BrowserProvider(window.ethereum);
      const s = await bp.getSigner();
      const network = await bp.getNetwork();
      const chainId = Number(network.chainId);

      if (chainId !== DAC_NETWORK.chainId) {
        await switchNetwork();
      }

      const balance = await fetchBalance(address, bp);
      setProvider(bp);
      setSigner(s);
      setWallet({
        isConnected: true,
        address,
        balance,
        chainId: DAC_NETWORK.chainId,
        isCorrectNetwork: true,
        provider: "metamask",
      });
      localStorage.setItem("walletConnected", "true");
    } catch (error) {
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [switchNetwork, fetchBalance]);

  const disconnect = useCallback(() => {
    setWallet(initialState);
    setProvider(null);
    setSigner(null);
    localStorage.removeItem("walletConnected");
  }, []);

  const refreshBalance = useCallback(async () => {
    if (wallet.address && provider) {
      const balance = await fetchBalance(wallet.address, provider);
      setWallet((prev) => ({ ...prev, balance }));
    }
  }, [wallet.address, provider, fetchBalance]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccounts = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else connect();
    };
    const handleChain = () => window.location.reload();
    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccounts);
      window.ethereum?.removeListener("chainChanged", handleChain);
    };
  }, [connect, disconnect]);

  useEffect(() => {
    if (localStorage.getItem("walletConnected") && isMetaMaskAvailable) {
      connect().catch(() => localStorage.removeItem("walletConnected"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { wallet, provider, signer, isConnecting, isMetaMaskAvailable, connect, disconnect, switchNetwork, refreshBalance };
}
