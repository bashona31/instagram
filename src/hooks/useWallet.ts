"use client";
/**
 * useWallet Hook - REAL blockchain wallet connection with ethers.js v6
 * 
 * CRITICAL: This hook properly creates BrowserProvider and Signer
 * so that signer.sendTransaction() triggers MetaMask popup.
 * 
 * Flow:
 * 1. Detect window.ethereum (MetaMask)
 * 2. Request accounts via eth_requestAccounts
 * 3. Create BrowserProvider from window.ethereum
 * 4. Get Signer from provider (this is what signs transactions)
 * 5. Validate chain ID matches DAC Testnet
 * 6. Auto-switch network if wrong chain
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { WalletState } from "@/types";
import { DAC_NETWORK } from "@/lib/constants";

const INITIAL: WalletState = {
  isConnected: false,
  address: null,
  balance: "0",
  chainId: null,
  isCorrectNetwork: false,
};

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(INITIAL);
  const [isConnecting, setIsConnecting] = useState(false);

  // Store provider and signer as refs so they persist across renders
  // and don't cause unnecessary re-renders
  const providerRef = useRef<ethers.BrowserProvider | null>(null);
  const signerRef = useRef<ethers.JsonRpcSigner | null>(null);

  const isMetaMaskAvailable = typeof window !== "undefined" && !!window.ethereum;

  /**
   * Get current balance for an address
   */
  const getBalance = useCallback(async (address: string, provider: ethers.BrowserProvider) => {
    try {
      const bal = await provider.getBalance(address);
      return ethers.formatEther(bal);
    } catch (e) {
      console.error("[useWallet] getBalance error:", e);
      return "0";
    }
  }, []);

  /**
   * Switch to DAC Testnet or add it if not present
   */
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    console.log("[useWallet] Switching to DAC Testnet...");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: DAC_NETWORK.chainIdHex }],
      });
      return true;
    } catch (err: any) {
      // Chain not added yet - add it
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: DAC_NETWORK.chainIdHex,
              chainName: DAC_NETWORK.networkName,
              nativeCurrency: {
                name: DAC_NETWORK.currencySymbol,
                symbol: DAC_NETWORK.currencySymbol,
                decimals: 18,
              },
              rpcUrls: [DAC_NETWORK.rpcUrl],
              blockExplorerUrls: [DAC_NETWORK.explorerUrl],
            }],
          });
          return true;
        } catch (addErr) {
          console.error("[useWallet] Failed to add chain:", addErr);
          return false;
        }
      }
      console.error("[useWallet] Failed to switch chain:", err);
      return false;
    }
  }, []);

  /**
   * CONNECT WALLET - Main connection function
   * This properly creates provider + signer for transaction signing
   */
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not found. Please install MetaMask.");
    }

    setIsConnecting(true);
    console.log("[useWallet] Connecting...");

    try {
      // Step 1: Request accounts - this triggers MetaMask popup
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from MetaMask");
      }

      const address = accounts[0];
      console.log("[useWallet] Account:", address);

      // Step 2: Create BrowserProvider from window.ethereum
      // THIS IS CRITICAL - BrowserProvider wraps MetaMask's provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      providerRef.current = provider;

      // Step 3: Get network info
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      console.log("[useWallet] Chain ID:", chainId);

      // Step 4: Auto-switch to DAC Testnet if wrong chain
      if (chainId !== DAC_NETWORK.chainId) {
        console.log("[useWallet] Wrong chain, switching...");
        const switched = await switchNetwork();
        if (!switched) {
          throw new Error("Please switch to DAC Testnet manually");
        }
        // Re-create provider after chain switch
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        providerRef.current = newProvider;
      }

      // Step 5: Get Signer - THIS IS WHAT SIGNS TRANSACTIONS
      // The signer is connected to MetaMask and will trigger popups
      const signer = await providerRef.current.getSigner();
      signerRef.current = signer;
      console.log("[useWallet] Signer ready:", await signer.getAddress());

      // Step 6: Get balance
      const balance = await getBalance(address, providerRef.current);
      console.log("[useWallet] Balance:", balance, DAC_NETWORK.currencySymbol);

      // Step 7: Update state
      setWallet({
        isConnected: true,
        address,
        balance,
        chainId: DAC_NETWORK.chainId,
        isCorrectNetwork: true,
      });

      localStorage.setItem("walletConnected", "true");
      console.log("[useWallet] Connected successfully!");
    } catch (err) {
      console.error("[useWallet] Connection failed:", err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [switchNetwork, getBalance]);

  /**
   * DISCONNECT wallet
   */
  const disconnect = useCallback(() => {
    console.log("[useWallet] Disconnecting...");
    setWallet(INITIAL);
    providerRef.current = null;
    signerRef.current = null;
    localStorage.removeItem("walletConnected");
  }, []);

  /**
   * REFRESH balance
   */
  const refreshBalance = useCallback(async () => {
    if (wallet.address && providerRef.current) {
      const balance = await getBalance(wallet.address, providerRef.current);
      setWallet(prev => ({ ...prev, balance }));
    }
  }, [wallet.address, getBalance]);

  /**
   * GET SIGNER - Returns the signer for transaction signing
   * Components call this to get the signer before sending transactions
   */
  const getSigner = useCallback(async (): Promise<ethers.JsonRpcSigner> => {
    if (signerRef.current) return signerRef.current;

    // If no signer, try to reconnect
    if (!window.ethereum) throw new Error("MetaMask not available");

    const provider = new ethers.BrowserProvider(window.ethereum);
    providerRef.current = provider;
    const signer = await provider.getSigner();
    signerRef.current = signer;
    return signer;
  }, []);

  /**
   * GET PROVIDER - Returns the provider for read operations
   */
  const getProvider = useCallback((): ethers.BrowserProvider | null => {
    return providerRef.current;
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("[useWallet] Accounts changed:", accounts);
      if (accounts.length === 0) {
        disconnect();
      } else {
        connect().catch(console.error);
      }
    };

    const handleChainChanged = () => {
      console.log("[useWallet] Chain changed, reloading...");
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [connect, disconnect]);

  // Auto-reconnect on mount
  useEffect(() => {
    if (localStorage.getItem("walletConnected") && isMetaMaskAvailable) {
      connect().catch(() => localStorage.removeItem("walletConnected"));
    }
  }, []); // eslint-disable-line

  return {
    wallet,
    isConnecting,
    isMetaMaskAvailable,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
    getSigner,
    getProvider,
  };
}
