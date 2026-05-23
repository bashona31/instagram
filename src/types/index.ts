export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  networkName: string;
  currencySymbol: string;
  rpcUrl: string;
  explorerUrl: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  chainId: number | null;
  isCorrectNetwork: boolean;
}

export interface Recipient {
  id: string;
  address: string;
  amount: string;
  isValid: boolean;
  isDuplicate: boolean;
  error?: string;
}

export enum TxStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
  RETRYING = "retrying",
  CANCELLED = "cancelled",
}

export interface TxRecord {
  id: string;
  recipient: string;
  amount: string;
  status: TxStatus;
  hash?: string;
  error?: string;
  gasUsed?: string;
  retryCount: number;
  timestamp: number;
}

export type SendMode = "native" | "erc20";

export interface QueueState {
  isRunning: boolean;
  isPaused: boolean;
  total: number;
  completed: number;
  success: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  transactions: TxRecord[];
}

export interface TokenConfig {
  name: string;
  symbol: string;
  supply: string;
  decimals: number;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
}

export interface DeployedToken {
  address: string;
  name: string;
  symbol: string;
  supply: string;
  txHash: string;
  timestamp: number;
}

export type ThemeMode = "dark" | "light";
export type TabView = "sender" | "creator" | "history";
