import { getChainByNetwork } from "@/config/chains";
import type { PayBatchReceive, PayrollCreateBatchPaymentParam } from "@/types/payout";
import type { IntentsToken, PayoutSymbol } from "@/stores/intents-tokens";
import { normalizeSymbol } from "@/stores/intents-tokens";
import { Big } from "@/utils";
import type { WalletChainKind } from "@/utils";
import { AMOUNT_MAX_DECIMALS, MEMO_MAX_LENGTH } from "./config";
import { detectAddressChainKind, parsePositiveDecimal } from "./utils";

export interface BatchDraft {
  id: string;
  address: string;
  chainKind: WalletChainKind | null;
  addressError: string | null;
  amount: string;
  memo: string;
  token: IntentsToken | null;
  rawToken: string;
  rawNetwork: string;
  tokenError: string | null;
}

export type BatchDraftPatch = Partial<Pick<BatchDraft, "address" | "amount" | "memo" | "token">>;

export type FindTokenByChainAndSymbol = (
  blockchain: string,
  symbol: PayoutSymbol,
) => IntentsToken | undefined;

type Field = "address" | "amount" | "token" | "network" | "memo";

const HEADER_ALIASES: Record<Field, string[]> = {
  address: ["recipient", "address", "wallet", "to", "destination"],
  amount: ["amount", "value"],
  token: ["token", "symbol", "asset"],
  network: ["network", "chain", "blockchain"],
  memo: ["memo", "note", "comment", "remark"],
};

export function clipMemo(value: string): string {
  return value.slice(0, MEMO_MAX_LENGTH);
}

export function sanitizeDecimalInput(raw: string, maxDecimals = AMOUNT_MAX_DECIMALS): string {
  const decimals = Number.isInteger(maxDecimals) && maxDecimals >= 0 ? maxDecimals : AMOUNT_MAX_DECIMALS;
  let out = "";
  let seenDot = false;
  let frac = 0;
  for (const ch of raw.replace(/,/g, "")) {
    if (ch >= "0" && ch <= "9") {
      if (seenDot) {
        if (frac >= decimals) continue;
        frac += 1;
      }
      out += ch;
      continue;
    }
    if (ch === "." && !seenDot && decimals > 0) {
      seenDot = true;
      if (!out) out = "0";
      out += ".";
    }
  }
  return out;
}

export function detectAddressKind(address: string): {
  chainKind: WalletChainKind | null;
  error: string | null;
} {
  const trimmed = String(address || "").trim();
  if (!trimmed) return { chainKind: null, error: "Address cannot be empty" };
  const kind = detectAddressChainKind(trimmed);
  if (!kind) return { chainKind: null, error: "Unrecognized address" };
  return { chainKind: kind, error: null };
}

export function resolveImportToken(
  rawToken: string,
  rawNetwork: string,
  chainKind: WalletChainKind | null,
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): { token: IntentsToken | null; tokenError: string | null } {
  const tokenLabel = rawToken.trim();
  const networkLabel = rawNetwork.trim();
  if (!tokenLabel && !networkLabel) {
    return { token: null, tokenError: "Select a token" };
  }
  const symbol = normalizeSymbol(tokenLabel);
  if (!symbol) {
    return { token: null, tokenError: tokenLabel ? "Unsupported token" : "Select a token" };
  }
  const chain = getChainByNetwork(networkLabel);
  if (!chain) {
    return { token: null, tokenError: networkLabel ? "Unsupported network" : "Select a token" };
  }
  const token = findByChainAndSymbol(chain.blockchain, symbol) ?? null;
  if (!token) {
    return { token: null, tokenError: "Token not found" };
  }
  if (chainKind && token.chain.chainKind !== chainKind) {
    return { token: null, tokenError: "Token network does not match address type" };
  }
  return { token, tokenError: null };
}

export function createEmptyDraft(memo = ""): BatchDraft {
  return {
    id: crypto.randomUUID(),
    address: "",
    chainKind: null,
    addressError: "Address cannot be empty",
    amount: "",
    memo: clipMemo(memo),
    token: null,
    rawToken: "",
    rawNetwork: "",
    tokenError: "Select a token",
  };
}

export function createDraftFromRaw(
  raw: { address: string; amount: string; token: string; network: string; memo: string },
  findByChainAndSymbol: FindTokenByChainAndSymbol,
  defaultMemo: string,
): BatchDraft {
  const address = raw.address.trim();
  const detected = detectAddressKind(address);
  const resolved = resolveImportToken(raw.token, raw.network, detected.chainKind, findByChainAndSymbol);
  const memo = clipMemo(raw.memo.trim() || defaultMemo);
  return {
    id: crypto.randomUUID(),
    address,
    chainKind: detected.chainKind,
    addressError: detected.error,
    amount: sanitizeDecimalInput(raw.amount),
    memo,
    token: resolved.token,
    rawToken: raw.token,
    rawNetwork: raw.network,
    tokenError: resolved.tokenError,
  };
}

export function amountError(amount: string): string | null {
  if (!amount.trim()) return "Amount is required";
  if (!parsePositiveDecimal(amount, AMOUNT_MAX_DECIMALS)) return "Amount must be greater than 0";
  return null;
}

export function isDraftValid(row: BatchDraft): boolean {
  return !row.addressError
    && !!row.chainKind
    && !!row.token
    && !row.tokenError
    && !amountError(row.amount);
}

export function allDraftsValid(rows: BatchDraft[]): boolean {
  return rows.length > 0 && rows.every(isDraftValid);
}

export function patchDraft(
  row: BatchDraft,
  patch: BatchDraftPatch,
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): BatchDraft {
  const next: BatchDraft = { ...row, ...patch };
  if (patch.memo !== undefined) next.memo = clipMemo(patch.memo);

  if (patch.address !== undefined) {
    const detected = detectAddressKind(next.address);
    next.chainKind = detected.chainKind;
    next.addressError = detected.error;
    if (next.token && next.chainKind && next.token.chain.chainKind !== next.chainKind) {
      next.token = null;
      next.tokenError = "Token network does not match address type";
    } else if (next.token && next.chainKind) {
      next.tokenError = null;
    } else if (!next.token) {
      const resolved = resolveImportToken(next.rawToken, next.rawNetwork, next.chainKind, findByChainAndSymbol);
      next.token = resolved.token;
      next.tokenError = resolved.tokenError;
    }
  }

  if (patch.token !== undefined) {
    if (next.token && next.chainKind && next.token.chain.chainKind !== next.chainKind) {
      next.token = null;
      next.tokenError = "Token network does not match address type";
    } else {
      next.tokenError = next.token ? null : "Select a token";
      if (next.token) {
        next.rawToken = next.token.symbol;
        next.rawNetwork = next.token.chain.chainName;
      }
    }
  }

  return next;
}

export function refillUnresolvedTokens(
  rows: BatchDraft[],
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): BatchDraft[] {
  let changed = false;
  const next = rows.map((row) => {
    if (row.token) return row;
    const resolved = resolveImportToken(row.rawToken, row.rawNetwork, row.chainKind, findByChainAndSymbol);
    if (!resolved.token) return row;
    changed = true;
    return { ...row, token: resolved.token, tokenError: resolved.tokenError };
  });
  return changed ? next : rows;
}

function normalizeHeader(cell: string): string {
  return cell.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function detectHeaderMap(row: string[]): Partial<Record<Field, number>> | null {
  const map: Partial<Record<Field, number>> = {};
  row.forEach((cell, index) => {
    const normalized = normalizeHeader(cell);
    (Object.keys(HEADER_ALIASES) as Field[]).forEach((field) => {
      if (map[field] != null) return;
      const match = HEADER_ALIASES[field].some((alias) => alias.replace(/[\s_-]+/g, "") === normalized);
      if (match) map[field] = index;
    });
  });
  return Object.keys(map).length >= 2 ? map : null;
}

function cellAt(row: string[], index: number | undefined): string {
  if (index == null) return "";
  return String(row[index] ?? "").trim();
}

function isEmptyRaw(raw: { address: string; amount: string; token: string; network: string; memo: string }): boolean {
  return !raw.address && !raw.amount && !raw.token && !raw.network && !raw.memo;
}

export function parseImportRows(
  values: string[][],
  findByChainAndSymbol: FindTokenByChainAndSymbol,
  defaultMemo: string,
): BatchDraft[] {
  if (!values.length) return [];
  const headerMap = detectHeaderMap(values[0] ?? []);
  const dataRows = headerMap ? values.slice(1) : values;
  const positional: Record<Field, number> = {
    address: 0,
    amount: 1,
    token: 2,
    network: 3,
    memo: 4,
  };
  const indexOf = (field: Field) => headerMap?.[field] ?? (headerMap ? undefined : positional[field]);

  const rows: BatchDraft[] = [];
  for (const row of dataRows) {
    const raw = {
      address: cellAt(row, indexOf("address")),
      amount: cellAt(row, indexOf("amount")),
      token: cellAt(row, indexOf("token")),
      network: cellAt(row, indexOf("network")),
      memo: cellAt(row, indexOf("memo")),
    };
    if (isEmptyRaw(raw)) continue;
    rows.push(createDraftFromRaw(raw, findByChainAndSymbol, defaultMemo));
  }
  return rows;
}

export function formatTokenNetwork(token: IntentsToken): string {
  return `${token.symbol} · ${token.chain.chainName}`;
}

export function sumDraftAmounts(rows: BatchDraft[]): string {
  return rows.reduce((sum, row) => {
    const parsed = parsePositiveDecimal(row.amount, AMOUNT_MAX_DECIMALS);
    if (!parsed) return sum;
    try {
      return new Big(sum).plus(parsed).toFixed();
    } catch {
      return sum;
    }
  }, "0");
}

export function toBatchReceives(rows: BatchDraft[]): PayBatchReceive[] {
  return rows.flatMap((row) => {
    const amount = parsePositiveDecimal(row.amount, AMOUNT_MAX_DECIMALS);
    if (!amount || !row.token) return [];
    const receive: PayBatchReceive = {
      address: row.address.trim(),
      amount,
      network: row.token.blockchain,
      token: row.token.symbol,
    };
    const memo = row.memo.trim();
    if (memo) receive.memo = memo;
    return [receive];
  });
}

export function toPayrollBatchPayments(rows: BatchDraft[]): PayrollCreateBatchPaymentParam[] {
  return rows.flatMap((row) => {
    const amount = parsePositiveDecimal(row.amount, AMOUNT_MAX_DECIMALS);
    if (!amount || !row.token) return [];
    const payment: PayrollCreateBatchPaymentParam = {
      amount,
      recipient: row.address.trim(),
      network: row.token.blockchain,
      symbol: row.token.symbol,
    };
    const memo = row.memo.trim();
    if (memo) payment.memo = memo;
    return [payment];
  });
}

export function isPayrollBatchExpired(deadline: string, now = Date.now()): boolean {
  const ms = Date.parse(deadline);
  if (!Number.isFinite(ms)) return false;
  return ms <= now;
}

export function groupTokenBreakdown(rows: BatchDraft[]): Array<{
  key: string;
  label: string;
  amount: string;
}> {
  const map = new Map<string, { label: string; amount: Big }>();
  for (const row of rows) {
    if (!row.token) continue;
    const parsed = parsePositiveDecimal(row.amount, AMOUNT_MAX_DECIMALS);
    if (!parsed) continue;
    const key = row.token.assetId;
    const label = formatTokenNetwork(row.token);
    const current = map.get(key);
    try {
      const add = new Big(parsed);
      if (current) current.amount = current.amount.plus(add);
      else map.set(key, { label, amount: add });
    } catch {
      // skip
    }
  }
  return Array.from(map.entries()).map(([key, value]) => ({
    key,
    label: value.label,
    amount: value.amount.toFixed(),
  }));
}

export function isBatchOriginToken(token: IntentsToken | null): boolean {
  return Boolean(token && token.chain.batchEnabled);
}

export function feeFromQuote(totalAmountInFormatted: string | undefined, totalOut: string): string | null {
  if (!totalAmountInFormatted) return null;
  try {
    const delta = new Big(totalAmountInFormatted).minus(totalOut);
    if (delta.lte(0)) return "0";
    return delta.toFixed();
  } catch {
    return null;
  }
}
