import type { PendingMultisigBroadcast } from "@/wallet/types";

export type StoredPendingMultisig =
  | {
      chainKind: "evm";
      safeTxHash: string;
      safeAddress: string;
      chainId: number;
    }
  | {
      chainKind: "near";
      proposalId: number;
      daoId: string;
    }
  | {
      chainKind: "solana";
      vaultAddress: string;
      multisigPda?: string;
      transactionIndex?: string;
    };

export function isWatchablePendingMultisig(result: PendingMultisigBroadcast): boolean {
  if (result.chainKind === "solana") {
    return Boolean(result.multisigPda && result.transactionIndex != null);
  }
  return true;
}

export function pendingMultisigSessionId(result: PendingMultisigBroadcast): string {
  if (result.chainKind === "evm") {
    return `evm:${result.chainId}:${result.safeTxHash.trim().toLowerCase()}`;
  }
  if (result.chainKind === "near") {
    return `near:${result.daoId.trim()}:${result.proposalId}`;
  }
  const index = result.transactionIndex != null ? result.transactionIndex.toString() : "";
  return `solana:${result.vaultAddress}:${result.multisigPda ?? ""}:${index}`;
}

export function serializePendingMultisig(result: PendingMultisigBroadcast): StoredPendingMultisig {
  if (result.chainKind === "evm") {
    return {
      chainKind: "evm",
      safeTxHash: result.safeTxHash,
      safeAddress: result.safeAddress,
      chainId: result.chainId,
    };
  }
  if (result.chainKind === "near") {
    return {
      chainKind: "near",
      proposalId: result.proposalId,
      daoId: result.daoId,
    };
  }
  return {
    chainKind: "solana",
    vaultAddress: result.vaultAddress,
    ...(result.multisigPda ? { multisigPda: result.multisigPda } : {}),
    ...(result.transactionIndex != null ? { transactionIndex: result.transactionIndex.toString() } : {}),
  };
}

export function deserializePendingMultisig(stored: StoredPendingMultisig): PendingMultisigBroadcast {
  if (stored.chainKind === "evm") {
    return {
      kind: "pending-multisig",
      chainKind: "evm",
      safeTxHash: stored.safeTxHash,
      safeAddress: stored.safeAddress,
      chainId: stored.chainId,
    };
  }
  if (stored.chainKind === "near") {
    return {
      kind: "pending-multisig",
      chainKind: "near",
      proposalId: stored.proposalId,
      daoId: stored.daoId,
    };
  }
  return {
    kind: "pending-multisig",
    chainKind: "solana",
    vaultAddress: stored.vaultAddress,
    ...(stored.multisigPda ? { multisigPda: stored.multisigPda } : {}),
    ...(stored.transactionIndex != null && stored.transactionIndex !== ""
      ? { transactionIndex: BigInt(stored.transactionIndex) }
      : {}),
  };
}
