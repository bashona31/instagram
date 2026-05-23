"use client";

// ============================================================
// useWallet Hook - Manages wallet connection and state
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { WalletState } from "@/types";
import { DAC_NETWORK } from "@/lib/constants";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
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

  // Check if MetaMask is available
  const isMetaMaskAvailable = typeof window !== "undefined" && !!window.ethereum;

  /**
   * Fetch wallet balance
   */
  const fetchBalance = useCallback(
    async (address: string, browserProvider: ethers.BrowserProvider) => {
      try {
        const balance = await browserProvider.getBalance(address);
        return ethers.formatEther(balance);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
        return "0";
      }
    },
    []
  );

  /**
   * Switch to DAC Testnet network
   */
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: DAC_NETWORK.chainIdHex }],
      });
      return true;
    } catch (switchError: unknown) {
      // If chain doesn't exist, add it
      const error = switchError as { code: number };
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: DAC_NETWORK.chainIdHex,
                chainName: DAC_NETWORK.networkName,
                nativeCurrency: {
                  name: DAC_NETWORK.currencySymbol,
                  symbol: DAC_NETWORK.currencySymbol,
                  decimals: 18,
                },
                rpcUrls: [DAC_NETWORK.rpcUrl],
                blockExplorerUrls: [DAC_NETWORK.explorerUrl],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add network:", addError);
          return false;
        }
      }
      console.error("Failed to switch network:", switchError);
      return false;
    }
  }, []);

  /**
   * Connect wallet via MetaMask
   */
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    setIsConnecting(true);

    try {
      // Request account access
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const address = accounts[0];
      const browserProvider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
      const walletSigner = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();
      const chainId = Number(network.chainId);

      // Auto switch to correct network if needed
      const isCorrectNetwork = chainId === DAC_NETWORK.chainId;
      if (!isCorrectNetwork) {
        await switchNetwork();
      }

      const balance = await fetchBalance(address, browserProvider);

      setProvider(browserProvider);
      setSigner(walletSigner);
      setWallet({
        isConnected: true,
        address,
        balance,
        chainId: DAC_NETWORK.chainId,
        isCorrectNetwork: true,
        provider: "metamask",
      });

      // Store connection in localStorage for auto-reconnect
      localStorage.setItem("walletConnected", "true");
    } catch (error) {
      console.error("Connection failed:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [switchNetwork, fetchBalance]);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setWallet(initialState);
    setProvider(null);
    setSigner(null);
    localStorage.removeItem("walletConnected");
  }, []);

  /**
   * Refresh balance
   */
  const refreshBalance = useCallback(async () => {
    if (wallet.address && provider) {
      const balance = await fetchBalance(wallet.address, provider);
      setWallet((prev) => ({ ...prev, balance }));
    }
  }, [wallet.address, provider, fetchBalance]);

  // Handle account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        disconnect();
      } else if (accs[0] !== wallet.address) {
        // Re-connect with new account
        connect();
      }
    };

    const handleChainChanged = () => {
      // Reload to reset state on chain change
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [wallet.address, connect, disconnect]);

  // Auto-reconnect on page load
  useEffect(() => {
    const wasConnected = localStorage.getItem("walletConnected");
    if (wasConnected && isMetaMaskAvailable) {
      connect().catch(() => {
        localStorage.removeItem("walletConnected");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    wallet,
    provider,
    signer,
    isConnecting,
    isMetaMaskAvailable,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
  };
}
