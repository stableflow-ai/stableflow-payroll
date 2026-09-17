# Multisig proposals

When a connected wallet is a Safe, Trezu / SputnikDAO, or Squads treasury, Send Payment proposes instead of broadcasting an EOA transaction. Two product behaviors are required for every chain adapter. Implement them before calling the chain live.

Code: `src/wallet/multisig/` (contract), `src/wallet/evm/safe/`, `src/wallet/near/multisig/`, `src/wallet/solana/multisig/`. UI: `src/components/multisig/multisig-proposal-toast.tsx`, `src/hooks/use-multisig-watch-host.ts`, `src/stores/multisig-watch-sessions.ts`.

## 1. Confirm toast (before the wallet SDK returns)

Show a persistent `info` toast as soon as Send Payment is clicked and the origin wallet is a known multisig. Do not wait for `txs.send` / Trezu / Squads to resolve.

- Title / queue link: `resolveMultisigConfirmToast(chainKind)` (`src/wallet/multisig/confirm.ts`). The proposal id is unknown, so the URL is the queue list (`safeQueueUrl`, `trezuRequestsUrl(daoId)`, `squadsQueueUrl`).
- `duration: false`. Close when the user clicks the link, clicks X, or the wallet SDK returns success / failure / reject.
- Closing the toast must not abort later watchers or submit.

Copy:

- Safe: `Confirm this transaction in your Safe` / `Review it in your Safe queue`
- Trezu: `Confirm this transaction in your Trezu treasury` / `Review it in your Trezu queue`
- Squads: `Confirm this transaction in your Squads treasury` / `Review it in your Squads queue`

The host is `AppWatchLayout` (root router layout) so toasts survive page changes. Toast 1 itself is created from the pay form; react-toastify lives in `App.tsx`.

## 2. Execution watch (after the proposal exists)

`broadcast*` returns `pending-multisig`. Start an in-tab watch session. Do not persist across tab close. Refresh in the same tab restores from Zustand `persist` + `sessionStorage` (`stableflow-pay:multisig-watch:v1`).

Implement `watch*` so it reports:

```ts
type MultisigWatchSnapshot = {
  signed: number | null;
  required: number | null;
  status: "pending" | "success" | "failed";
  txHash: string | null;
};
```

Then register it in `watchMultisigProposal` (`src/wallet/multisig/watch.ts` via `src/wallet/multisig/index.ts`). Hide n/m when either count is `null`.

Listen toast (`Waiting for multisig signatures`, optional `n / m signed`) is independent of the confirm toast. Closing it only sets `listenDismissed`; the watcher keeps running. Several batches each have their own session.

On **success**, always `POST /v1/payroll/payouts/submit` with `tx_hash` set to the on-chain hash or `""`. Then `notifyBatchPayoutCommitSuccess` for the existing `Transactions are in progress...` poll. `tx_hash` is optional on the backend; empty string is allowed. On **failed**, toast `Multisig transaction failed` (auto-close) and do not submit.

SquadsX has no vault transaction index: skip the watch, submit `tx_hash: ""` immediately.

## Chain capability

| Chain | n / m | On-chain `txHash` | Notes |
| --- | --- | --- | --- |
| Safe | `confirmations.length` / `confirmationsRequired` on Client Gateway details | Yes, after `SUCCESS` | Same GET the watcher already uses |
| NEAR Trezu | `vote_counts[role][0]` / `parseDaoInfo` threshold | Usually none | RoleWeight payment DAOs. Hide n/m if policy parse fails |
| Squads SDK | `proposal.approved.length` / `multisig.threshold` | Usually none | Create does not auto-approve, so n often starts at 0 |
| SquadsX | No | No | Submit empty hash after wrap |

Safe `AWAITING_EXECUTION` stays pending. Squads `Approved` stays pending until `Executed`. NEAR `Approved` is success.

## New chain checklist

1. Detect the wallet and return `pending-multisig` from broadcast.
2. Add queue URL + confirm copy to `resolveMultisigConfirmToast`.
3. Implement `watch*` → `MultisigWatchSnapshot` and branch in `watchMultisigProposal`.
4. If the proposal cannot be watched per-item, submit `tx_hash: ""` after create, same as SquadsX.
