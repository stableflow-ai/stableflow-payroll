/**
 * Resolve a pasted Squads vault or multisig address for the SDK path.
 */

import * as squads from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/rpc/solana";
import { memberProposalAccess } from "./access";
import {
  SQUADS_SDK_INVALID_ADDRESS_MESSAGE,
  SQUADS_SDK_NO_INITIATE_MESSAGE,
  SQUADS_SDK_NOT_MEMBER_MESSAGE,
  SQUADS_SDK_UNRESOLVED_MESSAGE,
  SQUADS_V4_PROGRAM_ID,
} from "./config";
import {
  listSquadsVaults,
  resolveMultisigPdaFromHistory,
  vaultIndexFor,
} from "./info";
import type { SquadsAccountInfo, SquadsSdkBinding } from "./types";

export type SquadsVaultOption = {
  index: number;
  vaultAddress: string;
};

export type SquadsPasteResult =
  | { kind: "vault"; binding: SquadsSdkBinding; info: SquadsAccountInfo }
  | { kind: "multisig"; info: SquadsAccountInfo; vaults: SquadsVaultOption[] };

function throwAccess(access: ReturnType<typeof memberProposalAccess>): never {
  if (access === "no-initiate") throw new Error(SQUADS_SDK_NO_INITIATE_MESSAGE);
  throw new Error(SQUADS_SDK_NOT_MEMBER_MESSAGE);
}

export function parsePastedSquadsAddress(raw: string): PublicKey {
  const trimmed = raw.trim();
  const fromUrl = trimmed.match(/\/squads\/([1-9A-HJ-NP-Za-km-z]{32,44})(?:\/|$|\?)/i);
  const value = fromUrl?.[1] ?? trimmed;
  try {
    return new PublicKey(value);
  } catch {
    throw new Error(SQUADS_SDK_INVALID_ADDRESS_MESSAGE);
  }
}

function toInfo(input: {
  decoded: Awaited<ReturnType<typeof squads.accounts.Multisig.fromAccountAddress>>;
  vaultAddress: string;
  multisigPda: string;
  vaultIndex: number;
  member: string;
}): SquadsAccountInfo {
  const access = memberProposalAccess(input.decoded.members, input.member);
  if (access !== "ok") throwAccess(access);
  return {
    vaultAddress: input.vaultAddress,
    multisigPda: input.multisigPda,
    vaultIndex: input.vaultIndex,
    threshold: input.decoded.threshold,
    members: input.decoded.members.map((row) => row.key.toBase58()),
    canInitiate: true,
  };
}

export async function inspectSquadsPaste(input: {
  pasted: string;
  member: string;
}): Promise<SquadsPasteResult> {
  const member = input.member.trim();
  if (!member) throw new Error(SQUADS_SDK_NOT_MEMBER_MESSAGE);
  const pasted = parsePastedSquadsAddress(input.pasted);
  const connection = getSolanaConnection();
  const account = await connection.getAccountInfo(pasted, "confirmed");

  if (account?.owner.equals(SQUADS_V4_PROGRAM_ID)) {
    try {
      const decoded = squads.accounts.Multisig.fromAccountInfo(account)[0];
      const access = memberProposalAccess(decoded.members, member);
      if (access !== "ok") throwAccess(access);
      const vaults = listSquadsVaults(pasted);
      const defaultVault = vaults[0];
      return {
        kind: "multisig",
        vaults,
        info: {
          vaultAddress: defaultVault.vaultAddress,
          multisigPda: pasted.toBase58(),
          vaultIndex: defaultVault.index,
          threshold: decoded.threshold,
          members: decoded.members.map((row) => row.key.toBase58()),
          canInitiate: true,
        },
      };
    } catch (error) {
      if (
        error instanceof Error
        && (error.message === SQUADS_SDK_NOT_MEMBER_MESSAGE
          || error.message === SQUADS_SDK_NO_INITIATE_MESSAGE)
      ) {
        throw error;
      }
      // Not a Multisig account owned by the program — fall through as a vault.
    }
  }

  const multisigPda = await resolveMultisigPdaFromHistory(connection, pasted);
  if (!multisigPda) throw new Error(SQUADS_SDK_UNRESOLVED_MESSAGE);
  const vaultIndex = vaultIndexFor(pasted, multisigPda);
  if (vaultIndex == null) throw new Error(SQUADS_SDK_UNRESOLVED_MESSAGE);
  const decoded = await squads.accounts.Multisig.fromAccountAddress(connection, multisigPda);
  const info = toInfo({
    decoded,
    vaultAddress: pasted.toBase58(),
    multisigPda: multisigPda.toBase58(),
    vaultIndex,
    member,
  });
  return {
    kind: "vault",
    binding: {
      member,
      vaultAddress: info.vaultAddress,
      multisigPda: info.multisigPda,
      vaultIndex: info.vaultIndex,
    },
    info,
  };
}

export type RestoreSquadsSdkResult =
  | { status: "ok"; binding: SquadsSdkBinding; info: SquadsAccountInfo }
  | { status: "cleared"; error: Error };

export async function restoreSquadsSdkBinding(
  binding: SquadsSdkBinding,
): Promise<RestoreSquadsSdkResult> {
  try {
    const info = await verifySquadsBinding(binding);
    return {
      status: "ok",
      binding: {
        member: binding.member,
        vaultAddress: info.vaultAddress,
        multisigPda: info.multisigPda,
        vaultIndex: info.vaultIndex,
      },
      info,
    };
  } catch (error) {
    return {
      status: "cleared",
      error: error instanceof Error ? error : new Error(String(error ?? "")),
    };
  }
}

export async function verifySquadsBinding(
  binding: SquadsSdkBinding,
): Promise<SquadsAccountInfo> {
  let vault: PublicKey;
  let multisigPda: PublicKey;
  try {
    vault = new PublicKey(binding.vaultAddress);
    multisigPda = new PublicKey(binding.multisigPda);
  } catch {
    throw new Error(SQUADS_SDK_INVALID_ADDRESS_MESSAGE);
  }
  const index = vaultIndexFor(vault, multisigPda);
  if (index !== binding.vaultIndex) throw new Error(SQUADS_SDK_UNRESOLVED_MESSAGE);
  const connection = getSolanaConnection();
  const decoded = await squads.accounts.Multisig.fromAccountAddress(connection, multisigPda);
  return toInfo({
    decoded,
    vaultAddress: binding.vaultAddress,
    multisigPda: binding.multisigPda,
    vaultIndex: binding.vaultIndex,
    member: binding.member,
  });
}

export function bindingFromVaultChoice(input: {
  member: string;
  multisigPda: string;
  vaultIndex: number;
}): SquadsSdkBinding {
  const member = input.member.trim();
  const multisigPda = new PublicKey(input.multisigPda);
  const vaults = listSquadsVaults(multisigPda);
  const chosen = vaults.find((row) => row.index === input.vaultIndex);
  if (!chosen) throw new Error(SQUADS_SDK_UNRESOLVED_MESSAGE);
  return {
    member,
    vaultAddress: chosen.vaultAddress,
    multisigPda: multisigPda.toBase58(),
    vaultIndex: chosen.index,
  };
}

export function isTransactionIndexConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /already in use|already initialized|transaction.?index/i.test(message);
}

export async function withTransactionIndexRetry(input: {
  readIndex: () => Promise<bigint>;
  send: (index: bigint) => Promise<void>;
}): Promise<void> {
  const first = await input.readIndex();
  try {
    await input.send(first);
  } catch (error) {
    if (!isTransactionIndexConflict(error)) throw error;
    const second = await input.readIndex();
    await input.send(second);
  }
}
