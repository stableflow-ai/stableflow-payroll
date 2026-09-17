/**
 * Squads v4 account state for the connected vault, for UI that needs m-of-n.
 *
 * The vault PDA holds no data. Threshold and members live on the Multisig
 * account, which is resolved from Wallet Standard features or recent on-chain
 * Squads instructions. Never cached across connections: members change.
 */

import * as multisig from "@sqds/multisig";
import { PublicKey, type AccountInfo, type Connection } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/rpc/solana";
import { SQUADS_INFO_SIGNATURE_LIMIT, SQUADS_V4_PROGRAM_ID, SQUADS_VAULT_INDEX_MAX } from "./config";
import { memberProposalAccess } from "./access";
import type { SquadsAccountInfo } from "./types";

type SquadsMultisigAccount = Awaited<ReturnType<typeof multisig.accounts.Multisig.fromAccountAddress>>;

const pdaByVault = new Map<string, string>();

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function pubkeyFromUnknown(value: unknown): PublicKey | null {
  if (typeof value === "string" && value.trim()) {
    try {
      return new PublicKey(value.trim());
    } catch {
      return null;
    }
  }
  if (value instanceof PublicKey) return value;
  if (value && typeof value === "object" && "toBase58" in value && typeof (value as PublicKey).toBase58 === "function") {
    try {
      return new PublicKey((value as PublicKey).toBase58());
    } catch {
      return null;
    }
  }
  return null;
}

function collectStringValues(value: unknown, into: string[]): void {
  if (typeof value === "string" && value.trim()) {
    into.push(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, into);
    return;
  }
  const record = asRecord(value);
  if (!record) return;
  for (const nested of Object.values(record)) collectStringValues(nested, into);
}

async function readFeatureMultisigPda(features: Record<string, unknown> | undefined): Promise<PublicKey | null> {
  if (!features) return null;
  for (const [key, feature] of Object.entries(features)) {
    if (!/multisig|squads/i.test(key)) continue;
    const record = asRecord(feature);
    const direct = pubkeyFromUnknown(record?.multisig ?? record?.multisigPda ?? record?.address);
    if (direct) return direct;
    const getter = record?.getMultisig ?? record?.getMultisigPda;
    if (typeof getter === "function") {
      try {
        const found = pubkeyFromUnknown(await getter());
        if (found) return found;
      } catch {
        // Feature methods are optional and wallet-specific.
      }
    }
    const nested: string[] = [];
    collectStringValues(feature, nested);
    for (const candidate of nested) {
      const parsed = pubkeyFromUnknown(candidate);
      if (parsed) return parsed;
    }
  }
  return null;
}

export function vaultIndexFor(vault: PublicKey, multisigPda: PublicKey): number | null {
  for (let index = 0; index <= SQUADS_VAULT_INDEX_MAX; index += 1) {
    const [derived] = multisig.getVaultPda({ multisigPda, index });
    if (derived.equals(vault)) return index;
  }
  return null;
}

export function listSquadsVaults(multisigPda: PublicKey): { index: number; vaultAddress: string }[] {
  const rows: { index: number; vaultAddress: string }[] = [];
  for (let index = 0; index <= SQUADS_VAULT_INDEX_MAX; index += 1) {
    const [derived] = multisig.getVaultPda({ multisigPda, index });
    rows.push({ index, vaultAddress: derived.toBase58() });
  }
  return rows;
}

function vaultMatchesMultisig(vault: PublicKey, multisigPda: PublicKey): boolean {
  return vaultIndexFor(vault, multisigPda) != null;
}

function decodeMultisigIfOwned(info: AccountInfo<Buffer> | null): SquadsMultisigAccount | null {
  if (!info?.owner.equals(SQUADS_V4_PROGRAM_ID)) return null;
  try {
    return multisig.accounts.Multisig.fromAccountInfo(info)[0];
  } catch {
    return null;
  }
}

function collectMessageAccountKeys(message: {
  accountKeys?: PublicKey[];
  getAccountKeys?: () => { length: number; get: (index: number) => PublicKey | undefined };
}): PublicKey[] {
  if (typeof message.getAccountKeys === "function") {
    const keys = message.getAccountKeys();
    const found: PublicKey[] = [];
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys.get(i);
      if (key) found.push(key);
    }
    return found;
  }
  return message.accountKeys ?? [];
}

export async function resolveMultisigPdaFromHistory(
  connection: Connection,
  vault: PublicKey,
): Promise<PublicKey | null> {
  const signatures = await connection.getSignaturesForAddress(vault, { limit: SQUADS_INFO_SIGNATURE_LIMIT });
  for (const item of signatures) {
    const tx = await connection.getTransaction(item.signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (!tx?.transaction.message) continue;
    const keys = collectMessageAccountKeys(tx.transaction.message);
    const unique = [...new Map(keys.map((key) => [key.toBase58(), key])).values()]
      .filter((key) => !key.equals(vault));
    if (!unique.length) continue;
    const infos = await connection.getMultipleAccountsInfo(unique, "confirmed");
    for (let i = 0; i < unique.length; i += 1) {
      const decoded = decodeMultisigIfOwned(infos[i]);
      if (!decoded) continue;
      if (vaultMatchesMultisig(vault, unique[i])) return unique[i];
    }
  }
  return null;
}

function toAccountInfo(
  decoded: SquadsMultisigAccount,
  vaultAddress: string,
  multisigPda: string,
  vaultIndex: number,
  member?: string,
): SquadsAccountInfo {
  const members = decoded.members.map((row) => row.key.toBase58());
  return {
    vaultAddress,
    multisigPda,
    vaultIndex,
    threshold: decoded.threshold,
    members,
    canInitiate: memberProposalAccess(decoded.members, member ?? "") === "ok",
  };
}

export function clearSquadsInfoCache(): void {
  pdaByVault.clear();
}

export async function getSquadsAccountInfo(input: {
  vaultAddress: string;
  features?: Record<string, unknown>;
  member?: string;
}): Promise<SquadsAccountInfo | null> {
  const vaultAddress = input.vaultAddress.trim();
  if (!vaultAddress) return null;
  let vault: PublicKey;
  try {
    vault = new PublicKey(vaultAddress);
  } catch {
    return null;
  }

  const connection = getSolanaConnection();
  const cachedPda = pdaByVault.get(vaultAddress);
  const fromFeature = await readFeatureMultisigPda(input.features);
  const resolvedPda = fromFeature
    ?? (cachedPda ? new PublicKey(cachedPda) : await resolveMultisigPdaFromHistory(connection, vault));
  if (!resolvedPda) return null;

  try {
    const decoded = await multisig.accounts.Multisig.fromAccountAddress(connection, resolvedPda);
    const vaultIndex = vaultIndexFor(vault, resolvedPda);
    if (vaultIndex == null) return null;
    pdaByVault.set(vaultAddress, resolvedPda.toBase58());
    return toAccountInfo(decoded, vaultAddress, resolvedPda.toBase58(), vaultIndex, input.member);
  } catch {
    pdaByVault.delete(vaultAddress);
    return null;
  }
}
