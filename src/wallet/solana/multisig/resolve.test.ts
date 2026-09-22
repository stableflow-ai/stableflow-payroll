import * as squads from "@sqds/multisig";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSolanaConnection } from "@/lib/rpc/solana";
import {
  SQUADS_SDK_INVALID_ADDRESS_MESSAGE,
  SQUADS_SDK_NO_INITIATE_MESSAGE,
  SQUADS_SDK_NOT_MEMBER_MESSAGE,
  SQUADS_SDK_UNRESOLVED_MESSAGE,
  SQUADS_V4_PROGRAM_ID,
} from "./config";
import {
  bindingFromVaultChoice,
  inspectSquadsPaste,
  isTransactionIndexConflict,
  parsePastedSquadsAddress,
  restoreSquadsSdkBinding,
  withTransactionIndexRetry,
} from "./resolve";

vi.mock("@/lib/rpc/solana", () => ({
  getSolanaConnection: vi.fn(),
}));

const PLACEHOLDER_ACCOUNT = {
  executable: false,
  lamports: 1,
  data: Buffer.alloc(0),
  owner: SQUADS_V4_PROGRAM_ID,
};

function permissions(kinds: squads.types.Permission[]) {
  return squads.types.Permissions.fromPermissions(kinds);
}

function mockConnection() {
  const connection = {
    getAccountInfo: vi.fn(),
    getSignaturesForAddress: vi.fn(),
    getTransaction: vi.fn(),
    getMultipleAccountsInfo: vi.fn(),
  };
  vi.mocked(getSolanaConnection).mockReturnValue(connection as never);
  return connection;
}

describe("parsePastedSquadsAddress", () => {
  const key = Keypair.generate().publicKey;

  it("accepts a base58 public key", () => {
    expect(parsePastedSquadsAddress(`  ${key.toBase58()}  `).equals(key)).toBe(true);
  });

  it("accepts a Squads app URL", () => {
    expect(parsePastedSquadsAddress(`https://app.squads.so/squads/${key.toBase58()}/transactions`).equals(key)).toBe(true);
  });

  it("rejects an invalid address", () => {
    expect(() => parsePastedSquadsAddress("not-a-key")).toThrow(SQUADS_SDK_INVALID_ADDRESS_MESSAGE);
  });
});

describe("inspectSquadsPaste", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a multisig paste that still needs a vault confirmation", async () => {
    const member = Keypair.generate().publicKey;
    const createKey = Keypair.generate().publicKey;
    const [multisigPda] = squads.getMultisigPda({ createKey });
    const connection = mockConnection();
    connection.getAccountInfo.mockResolvedValue(PLACEHOLDER_ACCOUNT);
    vi.spyOn(squads.accounts.Multisig, "fromAccountInfo").mockReturnValue([
      {
        members: [{ key: member, permissions: permissions([squads.types.Permission.Initiate]) }],
        threshold: 2,
      },
      0,
    ] as never);

    const result = await inspectSquadsPaste({
      pasted: multisigPda.toBase58(),
      member: member.toBase58(),
    });

    expect(result.kind).toBe("multisig");
    if (result.kind !== "multisig") return;
    expect(result.info.multisigPda).toBe(multisigPda.toBase58());
    expect(result.info.vaultIndex).toBe(0);
    expect(result.vaults[0]?.index).toBe(0);
    expect(result.vaults.length).toBeGreaterThan(1);
  });

  it("binds a vault paste without a selector", async () => {
    const member = Keypair.generate().publicKey;
    const createKey = Keypair.generate().publicKey;
    const [multisigPda] = squads.getMultisigPda({ createKey });
    const [vault] = squads.getVaultPda({ multisigPda, index: 1 });
    const connection = mockConnection();
    connection.getAccountInfo.mockResolvedValue({
      ...PLACEHOLDER_ACCOUNT,
      owner: SystemProgram.programId,
    });
    connection.getSignaturesForAddress.mockResolvedValue([{ signature: "sig" }]);
    connection.getTransaction.mockResolvedValue({
      transaction: { message: { accountKeys: [vault, multisigPda] } },
    });
    connection.getMultipleAccountsInfo.mockResolvedValue([PLACEHOLDER_ACCOUNT]);
    vi.spyOn(squads.accounts.Multisig, "fromAccountInfo").mockReturnValue([
      {
        members: [{ key: member, permissions: permissions([squads.types.Permission.Initiate]) }],
        threshold: 1,
      },
      0,
    ] as never);
    vi.spyOn(squads.accounts.Multisig, "fromAccountAddress").mockResolvedValue({
      members: [{ key: member, permissions: permissions([squads.types.Permission.Initiate]) }],
      threshold: 1,
    } as never);

    const result = await inspectSquadsPaste({
      pasted: vault.toBase58(),
      member: member.toBase58(),
    });

    expect(result.kind).toBe("vault");
    if (result.kind !== "vault") return;
    expect(result.binding.vaultAddress).toBe(vault.toBase58());
    expect(result.binding.vaultIndex).toBe(1);
    expect(result.binding.multisigPda).toBe(multisigPda.toBase58());
  });

  it("rejects a wallet that is not a member", async () => {
    const member = Keypair.generate().publicKey;
    const other = Keypair.generate().publicKey;
    const createKey = Keypair.generate().publicKey;
    const [multisigPda] = squads.getMultisigPda({ createKey });
    const connection = mockConnection();
    connection.getAccountInfo.mockResolvedValue(PLACEHOLDER_ACCOUNT);
    vi.spyOn(squads.accounts.Multisig, "fromAccountInfo").mockReturnValue([
      {
        members: [{ key: other, permissions: permissions([squads.types.Permission.Initiate]) }],
        threshold: 1,
      },
      0,
    ] as never);

    await expect(inspectSquadsPaste({
      pasted: multisigPda.toBase58(),
      member: member.toBase58(),
    })).rejects.toThrow(SQUADS_SDK_NOT_MEMBER_MESSAGE);
  });

  it("rejects a member without Initiate", async () => {
    const member = Keypair.generate().publicKey;
    const createKey = Keypair.generate().publicKey;
    const [multisigPda] = squads.getMultisigPda({ createKey });
    const connection = mockConnection();
    connection.getAccountInfo.mockResolvedValue(PLACEHOLDER_ACCOUNT);
    vi.spyOn(squads.accounts.Multisig, "fromAccountInfo").mockReturnValue([
      {
        members: [{ key: member, permissions: permissions([squads.types.Permission.Vote]) }],
        threshold: 1,
      },
      0,
    ] as never);

    await expect(inspectSquadsPaste({
      pasted: multisigPda.toBase58(),
      member: member.toBase58(),
    })).rejects.toThrow(SQUADS_SDK_NO_INITIATE_MESSAGE);
  });
});

describe("restoreSquadsSdkBinding", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ok when the member can still initiate", async () => {
    const member = Keypair.generate().publicKey;
    const createKey = Keypair.generate().publicKey;
    const [multisigPda] = squads.getMultisigPda({ createKey });
    const [vault] = squads.getVaultPda({ multisigPda, index: 0 });
    mockConnection();
    vi.spyOn(squads.accounts.Multisig, "fromAccountAddress").mockResolvedValue({
      members: [{ key: member, permissions: permissions([squads.types.Permission.Initiate]) }],
      threshold: 2,
    } as never);

    const result = await restoreSquadsSdkBinding({
      member: member.toBase58(),
      vaultAddress: vault.toBase58(),
      multisigPda: multisigPda.toBase58(),
      vaultIndex: 0,
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.binding.vaultAddress).toBe(vault.toBase58());
    expect(result.info.canInitiate).toBe(true);
  });

  it("clears when the member lost Initiate", async () => {
    const member = Keypair.generate().publicKey;
    const createKey = Keypair.generate().publicKey;
    const [multisigPda] = squads.getMultisigPda({ createKey });
    const [vault] = squads.getVaultPda({ multisigPda, index: 0 });
    mockConnection();
    vi.spyOn(squads.accounts.Multisig, "fromAccountAddress").mockResolvedValue({
      members: [{ key: member, permissions: permissions([squads.types.Permission.Vote]) }],
      threshold: 1,
    } as never);

    const result = await restoreSquadsSdkBinding({
      member: member.toBase58(),
      vaultAddress: vault.toBase58(),
      multisigPda: multisigPda.toBase58(),
      vaultIndex: 0,
    });

    expect(result).toEqual({
      status: "cleared",
      error: expect.objectContaining({ message: SQUADS_SDK_NO_INITIATE_MESSAGE }),
    });
  });

  it("clears when the wallet is no longer a member", async () => {
    const member = Keypair.generate().publicKey;
    const createKey = Keypair.generate().publicKey;
    const [multisigPda] = squads.getMultisigPda({ createKey });
    const [vault] = squads.getVaultPda({ multisigPda, index: 0 });
    mockConnection();
    vi.spyOn(squads.accounts.Multisig, "fromAccountAddress").mockResolvedValue({
      members: [],
      threshold: 1,
    } as never);

    const result = await restoreSquadsSdkBinding({
      member: member.toBase58(),
      vaultAddress: vault.toBase58(),
      multisigPda: multisigPda.toBase58(),
      vaultIndex: 0,
    });

    expect(result.status).toBe("cleared");
    if (result.status !== "cleared") return;
    expect(result.error.message).toBe(SQUADS_SDK_NOT_MEMBER_MESSAGE);
  });
});

describe("bindingFromVaultChoice", () => {
  it("derives the vault PDA for the confirmed index", () => {
    const createKey = Keypair.generate().publicKey;
    const [multisigPda] = squads.getMultisigPda({ createKey });
    const [vault] = squads.getVaultPda({ multisigPda, index: 2 });
    const member = Keypair.generate().publicKey.toBase58();
    expect(bindingFromVaultChoice({
      member,
      multisigPda: multisigPda.toBase58(),
      vaultIndex: 2,
    })).toEqual({
      member,
      vaultAddress: vault.toBase58(),
      multisigPda: multisigPda.toBase58(),
      vaultIndex: 2,
    });
  });

  it("rejects an index outside the vault range", () => {
    expect(() => bindingFromVaultChoice({
      member: Keypair.generate().publicKey.toBase58(),
      multisigPda: Keypair.generate().publicKey.toBase58(),
      vaultIndex: 99,
    })).toThrow(SQUADS_SDK_UNRESOLVED_MESSAGE);
  });
});

describe("withTransactionIndexRetry", () => {
  it("sends once when the first index succeeds", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    await withTransactionIndexRetry({
      readIndex: async () => 4n,
      send,
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(4n);
  });

  it("retries once after an index conflict and then succeeds", async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(new Error("already in use"))
      .mockResolvedValueOnce(undefined);
    const readIndex = vi.fn()
      .mockResolvedValueOnce(4n)
      .mockResolvedValueOnce(5n);

    await withTransactionIndexRetry({ readIndex, send });

    expect(readIndex).toHaveBeenCalledTimes(2);
    expect(send.mock.calls.map((call) => call[0])).toEqual([4n, 5n]);
  });

  it("throws when the retried send still fails", async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(new Error("transaction index already initialized"))
      .mockRejectedValueOnce(new Error("transaction index already initialized"));

    await expect(withTransactionIndexRetry({
      readIndex: async () => 1n,
      send,
    })).rejects.toThrow(/transaction index/);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-index error", async () => {
    const send = vi.fn().mockRejectedValue(new Error("user rejected"));
    await expect(withTransactionIndexRetry({
      readIndex: async () => 1n,
      send,
    })).rejects.toThrow("user rejected");
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe("isTransactionIndexConflict", () => {
  it("matches Squads index collisions", () => {
    expect(isTransactionIndexConflict(new Error("already in use"))).toBe(true);
    expect(isTransactionIndexConflict("already initialized")).toBe(true);
    expect(isTransactionIndexConflict(new Error("user rejected"))).toBe(false);
  });
});
