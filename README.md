# Stableflow Pay

Cross-chain stablecoin payouts for businesses. A signed-in account can send a single payout, import a batch from CSV or Google Sheets, track pending transfers, and export transaction history — paying from one wallet on EVM, Near, Solana, or Tron while each recipient is paid on their own chain.

Vite 8 + React 19 + React Router 7, Tailwind CSS 4, TanStack Query, and Zustand.

## Scripts

```bash
pnpm install
pnpm dev        # http://127.0.0.1:5201
pnpm check      # tsc -b
pnpm test       # vitest run
pnpm build      # production bundle (Vite 8 + Rolldown)
pnpm preview
```

Copy `.env.example` to `.env.local`. `VITE_API_BASE_URL` is required (the browser calls the backend directly; there is no dev proxy). Fill in `VITE_WALLETCONNECT_PROJECT_ID` for wallet connections, plus the optional RPC proxy and Google Sheets values.

## Documentation

Start at [AGENTS.md](AGENTS.md) for the working rules, then:

- [doc/product.md](doc/product.md) — what ships today and how each screen behaves
- [doc/project-structure.md](doc/project-structure.md) — stack, folder map, environment variables
- [doc/conventions.md](doc/conventions.md) — coding conventions
- [doc/api.md](doc/api.md) — HTTP layer and the endpoint table
- [doc/components/README.md](doc/components/README.md) — public UI components
