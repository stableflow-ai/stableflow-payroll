import type { IntentsToken } from "@/stores/intents-tokens";
import { normalizeSymbol } from "@/stores/intents-tokens";
import type { WalletChainKind } from "@/utils";
import { Big } from "@/utils";
import {
  amountError,
  detectAddressKind,
  resolveImportToken,
  type FindTokenByChainAndSymbol,
} from "@/views/pay/batch-utils";
import { isValidEmail } from "@/views/pay/utils";
import type {
  BonusPendingItem,
  BonusPendingList,
  BonusPendingRow,
} from "@/mocks/bonus";
import { BONUS_ROW_ACTION } from "./config";

export type BonusFormRow = {
  id: string;
  name: string;
  address: string;
  email: string;
  chainKind: WalletChainKind | null;
  addressError: string | null;
  amount: string;
  token: IntentsToken | null;
  rawToken: string;
  rawNetwork: string;
};

export type BonusFormRowPatch = Partial<
  Pick<BonusFormRow, "name" | "address" | "email" | "amount" | "token">
>;

export function bonusEmailError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isValidEmail(trimmed) ? null : "Enter a valid email";
}

export function formatBonusTokenAmount(amount: string, token: string) {
  const trimmed = amount.trim();
  if (!token) return trimmed || "0";
  return `${trimmed || "0"} ${token}`;
}

export function createEmptyBonusFormRow(): BonusFormRow {
  const detected = detectAddressKind("");
  return {
    id: crypto.randomUUID(),
    name: "",
    address: "",
    email: "",
    chainKind: detected.chainKind,
    addressError: detected.error,
    amount: "",
    token: null,
    rawToken: "",
    rawNetwork: "",
  };
}

export function formRowFromPending(
  row: BonusPendingRow,
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): BonusFormRow {
  const detected = detectAddressKind(row.address);
  const resolved = resolveImportToken(
    row.token,
    row.network,
    detected.chainKind,
    findByChainAndSymbol,
  );
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    email: row.email,
    chainKind: detected.chainKind,
    addressError: detected.error,
    amount: row.amount,
    token: resolved.token,
    rawToken: row.token,
    rawNetwork: row.network,
  };
}

export function pendingItemsToFormRows(
  items: BonusPendingItem[],
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): BonusFormRow[] {
  const rows: BonusPendingRow[] = [];
  for (const item of items) {
    for (const member of item.members) {
      rows.push({
        id: member.id,
        name: member.name,
        address: member.address,
        email: member.email,
        token: member.token,
        network: "near",
        amount: member.amount,
      });
    }
  }
  return rows.map((row) => formRowFromPending(row, findByChainAndSymbol));
}

export function patchBonusFormRow(
  row: BonusFormRow,
  patch: BonusFormRowPatch,
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): BonusFormRow {
  const next: BonusFormRow = { ...row, ...patch };

  if (patch.address !== undefined) {
    const detected = detectAddressKind(next.address);
    next.chainKind = detected.chainKind;
    next.addressError = detected.error;
    if (next.token && next.chainKind && next.token.chain.chainKind !== next.chainKind) {
      next.token = null;
      next.rawToken = "";
      next.rawNetwork = "";
    }
  }

  if (patch.token !== undefined) {
    next.rawToken = patch.token?.symbol ?? "";
    next.rawNetwork = patch.token?.blockchain ?? "";
    if (next.token && next.chainKind && next.token.chain.chainKind !== next.chainKind) {
      next.token = null;
      next.rawToken = "";
      next.rawNetwork = "";
    }
  }

  if (!next.token && (next.rawToken || next.rawNetwork)) {
    const resolved = resolveImportToken(
      next.rawToken,
      next.rawNetwork,
      next.chainKind,
      findByChainAndSymbol,
    );
    next.token = resolved.token;
  }

  return next;
}

export function refillBonusFormTokens(
  rows: BonusFormRow[],
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): BonusFormRow[] {
  return rows.map((row) => {
    if (row.token || (!row.rawToken && !row.rawNetwork)) return row;
    const resolved = resolveImportToken(
      row.rawToken,
      row.rawNetwork,
      row.chainKind,
      findByChainAndSymbol,
    );
    return { ...row, token: resolved.token };
  });
}

export function isBonusFormRowValid(row: BonusFormRow): boolean {
  return (
    Boolean(row.name.trim()) &&
    !row.addressError &&
    !bonusEmailError(row.email) &&
    Boolean(row.chainKind) &&
    Boolean(row.token) &&
    !amountError(row.amount)
  );
}

export function isBonusFormValid(rows: BonusFormRow[], title: string): boolean {
  return Boolean(title.trim()) && rows.length > 0 && rows.every(isBonusFormRowValid);
}

export function sumBonusFormAmounts(rows: BonusFormRow[]): string {
  return rows.reduce((sum, row) => {
    const trimmed = row.amount.trim();
    if (!trimmed || amountError(trimmed)) return sum;
    try {
      return new Big(sum).plus(trimmed).toFixed();
    } catch {
      return sum;
    }
  }, "0");
}

export function formRowsToPendingList(
  rows: BonusFormRow[],
  title: string,
): BonusPendingList {
  const members = rows.map((row) => {
    const symbol = row.token?.symbol ?? normalizeSymbol(row.rawToken) ?? row.rawToken;
    return {
      id: row.id,
      name: row.name.trim(),
      address: row.address.trim(),
      email: row.email.trim(),
      amount: row.amount.trim(),
      token: symbol,
    };
  });
  const token = members[0]?.token ?? "";
  const totalAmount = sumBonusFormAmounts(rows);
  return {
    totalAmount,
    token,
    entryCount: 1,
    items: [
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        amount: totalAmount,
        token,
        action: BONUS_ROW_ACTION.PayNow,
        members,
      },
    ],
  };
}
