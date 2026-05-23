# DAC Bulk Sender

Advanced Web3 Bulk Sender for DAC Testnet - A premium crypto SaaS dashboard for sending DACC and ERC20 tokens to hundreds of wallets simultaneously.

![DAC Bulk Sender](https://img.shields.io/badge/DAC-Bulk%20Sender-ec4899?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square)

## Features

### Wallet Integration
- MetaMask connection with auto-reconnect
- Automatic network switching to DAC Testnet
- Real-time balance display
- One-click address copy

### Bulk Sending
- Native DACC bulk transfers
- ERC20 token bulk transfers
- Manual wallet input (address,amount format)
- CSV file upload with drag & drop
- Auto address validation
- Duplicate detection
- Invalid address filtering

### Transaction Engine
- 10 concurrent transactions processing
- Queue-based system with retry logic
- Pause/Resume/Cancel controls
- Live status updates per transaction
- Progress tracking bar
- Success/Failed counters

### Analytics & Export
- Total wallets/amount/gas statistics
- Success rate calculation
- CSV export of transaction history
- Clickable explorer links for each TX

### Smart Contract
- Solidity contract for batch native transfers
- Batch ERC20 token transfers
- Emergency withdraw functions
- Reentrancy protection
- Gas optimized with unchecked increments

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 15 | React Framework |
| TypeScript | Type Safety |
| TailwindCSS | Styling |
| Framer Motion | Animations |
| ethers.js v6 | Blockchain Interaction |
| react-hot-toast | Notifications |
| PapaParse | CSV Parsing |

## Network Configuration

| Parameter | Value |
|-----------|-------|
| Network Name | DAC Testnet |
| Chain ID | 21894 |
| Currency Symbol | DACC |
| RPC URL | https://rpctest.dachain.tech |
| Explorer URL | https://exptest.dachain.tech |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask browser extension

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd dac-bulk-sender

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── layout.tsx    # Root layout with theme
│   └── page.tsx      # Main application page
├── components/       # React components
│   ├── ui/           # Reusable UI primitives
│   ├── Header.tsx    # App header with wallet
│   ├── BulkSenderForm.tsx
│   ├── TransactionProgress.tsx
│   ├── AnalyticsDashboard.tsx
│   ├── NetworkBadge.tsx
│   ├── WalletPrompt.tsx
│   └── Footer.tsx
├── hooks/            # Custom React hooks
│   ├── useWallet.ts
│   ├── useTransactionQueue.ts
│   └── useTheme.ts
├── contracts/        # Smart contract + ABI
│   ├── BulkSender.sol
│   └── abi.ts
├── utils/            # Utility functions
│   ├── validation.ts
│   ├── format.ts
│   └── csv.ts
├── lib/              # Config & helpers
│   ├── constants.ts
│   └── cn.ts
├── styles/           # Global CSS
│   └── globals.css
└── types/            # TypeScript types
    └── index.ts
```

## Smart Contract Deployment

1. Deploy `src/contracts/BulkSender.sol` to DAC Testnet
2. Update `NEXT_PUBLIC_BULK_SENDER_CONTRACT` in `.env.local`
3. Verify contract on DAC Explorer

## CSV Format

```csv
address,amount
0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28,1.5
0x53d284357ec70cE289D6D64134DfAc8E511c8a3D,2.0
```

## License

MIT
