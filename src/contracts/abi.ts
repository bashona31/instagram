export const BULK_SENDER_ABI = [
  "function bulkSendNative(address[] recipients, uint256[] amounts) payable",
  "function bulkSendNativeEqual(address[] recipients, uint256 amount) payable",
  "function bulkSendToken(address token, address[] recipients, uint256[] amounts)",
  "function emergencyWithdraw()",
  "function emergencyTokenWithdraw(address token)",
  "function owner() view returns (address)",
  "function MAX_BATCH_SIZE() view returns (uint256)",
  "event NativeBulkSend(address indexed sender, uint256 totalAmount, uint256 recipientCount)",
  "event TokenBulkSend(address indexed sender, address indexed token, uint256 totalAmount, uint256 recipientCount)",
] as const;

export const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
] as const;
