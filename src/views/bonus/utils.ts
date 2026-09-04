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
import type { BonusPendingList, BonusPendingRow } from "@/mocks/bonus";
import {
  BONUS_PAY_DATE,
  BONUS_PAY_DATE_OPTIONS,
  type BonusPayDate,
} from "./config";

export type BonusFormRow = {
  id: string;
  name: string;
  address: string;
  chainKind: WalletChainKind | null;
  addressError: string | null;
  amount: string;
  token: IntentsToken | null;
  rawToken: string;
  rawNetwork: string;
};

export type BonusFormRowPatch = Partial<
  Pick<BonusFormRow, "name" | "address" | "amount" | "token">
>;

export function defaultBonusPayDate(): BonusPayDate {
  return BONUS_PAY_DATE.NextMonth1st;
}

export function payDateLabel(value: BonusPayDate): string {
  return (
    BONUS_PAY_DATE_OPTIONS.find((option) => option.value === value)?.label ??
    BONUS_PAY_DATE_OPTIONS[0].label
  );
}

export function payDateFromLabel(label: string | undefined): BonusPayDate {
  const match = BONUS_PAY_DATE_OPTIONS.find((option) => option.label === label);
  return match?.value ?? defaultBonusPayDate();
}

export function createEmptyBonusFormRow(): BonusFormRow {
  const detected = detectAddressKind("");
  return {
    id: crypto.randomUUID(),
    name: "",
    address: "",
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
    chainKind: detected.chainKind,
    addressError: detected.error,
    amount: row.amount,
    token: resolved.token,
    rawToken: row.token,
    rawNetwork: row.network,
  };
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
    Boolean(row.chainKind) &&
    Boolean(row.token) &&
    !amountError(row.amount)
  );
}

export function isBonusFormValid(rows: BonusFormRow[]): boolean {
  return rows.length > 0 && rows.every(isBonusFormRowValid);
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
  payDate: BonusPayDate,
): BonusPendingList {
  const mapped: BonusPendingRow[] = rows.map((row) => {
    const symbol = row.token?.symbol ?? normalizeSymbol(row.rawToken) ?? row.rawToken;
    const network = row.token?.blockchain ?? row.rawNetwork;
    return {
      id: row.id,
      name: row.name.trim(),
      address: row.address.trim(),
      token: symbol,
      network,
      amount: row.amount.trim(),
    };
  });
  return {
    totalPayout: sumBonusFormAmounts(rows),
    members: mapped.length,
    payDate: payDateLabel(payDate),
    rows: mapped,
  };
}
