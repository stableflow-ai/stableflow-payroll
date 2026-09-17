/**
 * SquadsX wallet detection.
 *
 * The extension is a Wallet Standard wallet. It is identifiable by name or by
 * the Fuse `getEphemeralSigners` feature. Broadcast reads the same answer from
 * the module-level session so it does not pull in React.
 */

import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { getSolanaWalletMeta } from "../session";
import {
  FUSE_GET_EPHEMERAL_SIGNERS_FEATURE,
  SQUADS_V4_PROGRAM_ID,
  SQUADS_X_WALLET_NAME_PATTERN,
} from "./config";
import type { SquadsMode } from "./types";

type WalletStandardLike = {
  features?: Record<string, unknown>;
};

type AdapterLike = {
  name?: string;
  wallet?: WalletStandardLike;
};

function asAdapter(value: unknown): AdapterLike | null {
  if (!value || typeof value !== "object") return null;
  return value as AdapterLike;
}

export function isSquadsXWalletName(name: string | null | undefined): boolean {
  return SQUADS_X_WALLET_NAME_PATTERN.test((name ?? "").trim());
}

export function adapterHasFuseEphemeralSigners(adapter: unknown): boolean {
  const features = asAdapter(adapter)?.wallet?.features;
  return Boolean(features && FUSE_GET_EPHEMERAL_SIGNERS_FEATURE in features);
}

export function isSquadsXAdapter(adapter: unknown): boolean {
  const next = asAdapter(adapter);
  if (!next) return false;
  return isSquadsXWalletName(next.name) || adapterHasFuseEphemeralSigners(next);
}

/**
 * Which Squads shape the current connection is, or `null` for a plain keypair
 * wallet. Module-level so broadcast can branch without React.
 */
export function activeSquadsMode(): SquadsMode | null {
  return getSolanaWalletMeta()?.isSquadsX ? "squadsx" : null;
}

function instructionProgramIds(tx: Transaction | VersionedTransaction): PublicKey[] {
  if (tx instanceof VersionedTransaction) {
    const keys = tx.message.getAccountKeys();
    return tx.message.compiledInstructions.flatMap((instruction) => {
      const programId = keys.get(instruction.programIdIndex);
      return programId ? [programId] : [];
    });
  }
  return tx.instructions.map((instruction) => instruction.programId);
}

/** True when the signed bytes call the Squads v4 program (a wrapped proposal). */
export function isSquadsV4Transaction(tx: Transaction | VersionedTransaction): boolean {
  return instructionProgramIds(tx).some((programId) => programId.equals(SQUADS_V4_PROGRAM_ID));
}
