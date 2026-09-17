import { Keypair, SystemProgram, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { afterEach, describe, expect, it } from "vitest";
import { SQUADS_V4_PROGRAM_ID } from "./config";
import { setSolanaSigner, setSolanaWalletMeta, setSquadsSdkBinding } from "../session";
import { activeSquadsMode, adapterHasFuseEphemeralSigners, isSquadsV4Transaction, isSquadsXAdapter, isSquadsXWalletName } from "./detect";

const PLACEHOLDER_BLOCKHASH = "11111111111111111111111111111111";

function versionedTxForProgram(programId: typeof SystemProgram.programId) {
  const payer = Keypair.generate().publicKey;
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: PLACEHOLDER_BLOCKHASH,
    instructions: [
      {
        programId,
        keys: [],
        data: Buffer.alloc(0),
      },
    ],
  }).compileToV0Message();
  return new VersionedTransaction(message);
}

describe("SquadsX detection", () => {
  it("matches SquadsX wallet names", () => {
    expect(isSquadsXWalletName("SquadsX")).toBe(true);
    expect(isSquadsXWalletName("Squads X")).toBe(true);
    expect(isSquadsXWalletName("Phantom")).toBe(false);
  });

  it("detects the Fuse ephemeral-signer feature", () => {
    expect(adapterHasFuseEphemeralSigners({
      name: "Other",
      wallet: { features: { "fuse:getEphemeralSigners": {} } },
    })).toBe(true);
    expect(isSquadsXAdapter({
      name: "Other",
      wallet: { features: { "fuse:getEphemeralSigners": {} } },
    })).toBe(true);
    expect(isSquadsXAdapter({ name: "Phantom" })).toBe(false);
  });

  it("recognizes a Squads v4 wrapped transaction", () => {
    expect(isSquadsV4Transaction(versionedTxForProgram(SQUADS_V4_PROGRAM_ID))).toBe(true);
    expect(isSquadsV4Transaction(versionedTxForProgram(SystemProgram.programId))).toBe(false);
    expect(isSquadsV4Transaction(new Transaction())).toBe(false);
  });
});

describe("activeSquadsMode", () => {
  afterEach(() => {
    setSolanaSigner(null);
    setSolanaWalletMeta(null);
    setSquadsSdkBinding(null);
  });

  it("returns squadsx from wallet meta even if an SDK binding exists", () => {
    const key = Keypair.generate();
    setSolanaSigner({ publicKey: key.publicKey, signTransaction: async (tx) => tx });
    setSolanaWalletMeta({ name: "SquadsX", isSquadsX: true });
    setSquadsSdkBinding({
      member: key.publicKey.toBase58(),
      vaultAddress: Keypair.generate().publicKey.toBase58(),
      multisigPda: Keypair.generate().publicKey.toBase58(),
      vaultIndex: 0,
    });
    expect(activeSquadsMode()).toBe("squadsx");
  });

  it("returns sdk when the session binding matches the connected member", () => {
    const key = Keypair.generate();
    setSolanaSigner({ publicKey: key.publicKey, signTransaction: async (tx) => tx });
    setSolanaWalletMeta({ name: "Phantom", isSquadsX: false });
    setSquadsSdkBinding({
      member: key.publicKey.toBase58(),
      vaultAddress: Keypair.generate().publicKey.toBase58(),
      multisigPda: Keypair.generate().publicKey.toBase58(),
      vaultIndex: 0,
    });
    expect(activeSquadsMode()).toBe("sdk");
  });

  it("returns null when the binding belongs to another member", () => {
    const key = Keypair.generate();
    setSolanaSigner({ publicKey: key.publicKey, signTransaction: async (tx) => tx });
    setSolanaWalletMeta({ name: "Phantom", isSquadsX: false });
    setSquadsSdkBinding({
      member: Keypair.generate().publicKey.toBase58(),
      vaultAddress: Keypair.generate().publicKey.toBase58(),
      multisigPda: Keypair.generate().publicKey.toBase58(),
      vaultIndex: 0,
    });
    expect(activeSquadsMode()).toBeNull();
  });
});
