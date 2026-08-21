# Stableflow Pay

USDC/USDT payroll for global teams. This repo is a blank frontend scaffold: Vite 8 + React 19, with EVM / Near / Solana / Tron wallet providers wired up. Product pages, APIs, and mocks are not included yet.

## Scripts

```bash
pnpm install
pnpm dev        # http://127.0.0.1:5200
pnpm check      # tsc -b
pnpm test       # vitest
pnpm build      # production bundle (Vite 8 + Rolldown)
pnpm preview
```

Copy `.env.example` to `.env.local` and fill in `VITE_WALLETCONNECT_PROJECT_ID` (shared by RainbowKit and the Tron WalletConnect adapter) plus optional RPC proxy values.
