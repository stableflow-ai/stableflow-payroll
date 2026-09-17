import { Keypair, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IntentsToken } from "@/stores/intents-tokens";
import { pendingSquadsMultisigBroadcast } from "./types";
import { broadcastBatchPayout } from "./broadcast-batch-payout";
import { buildSolanaDepositTx } from "./solana/build-deposit-tx";
import { activeSquadsMode, sendViaSquads, sendViaSquadsSdk } from "./solana/multisig";
import { broadcastSolanaTransaction } from "./solana/transfer";

vi.mock("./solana/build-deposit-tx", () => ({
  buildSolanaDepositTx: vi.fn(),
}));

vi.mock("./solana/multisig", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./solana/multisig")>();
  return {
    ...actual,
    activeSquadsMode: vi.fn(),
    sendViaSquads: vi.fn(),
    sendViaSquadsSdk: vi.fn(),
  };
});

vi.mock("./solana/transfer", () => ({
  broadcastSolanaTransaction: vi.fn(),
}));

const VAULT = Keypair.generate().publicKey.toBase58();
const PLACEHOLDER_BLOCKHASH = "11111111111111111111111111111111";

function unsignedTx() {
  const payer = Keypair.generate().publicKey;
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: PLACEHOLDER_BLOCKHASH,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: Keypair.generate().publicKey,
        lamports: 1n,
      }),
    ],
  }).compileToV0Message();
  return new VersionedTransaction(message);
}

const solToken = {
  assetId: "sol",
  decimals: 9,
  blockchain: "sol",
  symbol: "SOL",
  providerSymbol: "SOL",
  price: 1,
  contractAddress: null,
  logo: "",
  chain: {
    blockchain: "sol",
    chainName: "Solana",
    chainKind: "solana",
    logo: "",
    payerEnabled: true,
    batchEnabled: true,
    txExplorer: "",
  },
} as IntentsToken;

describe("broadcastBatchPayout Solana Squads", () => {
  const unsigned = unsignedTx();

  beforeEach(() => {
    vi.mocked(buildSolanaDepositTx).mockReset();
    vi.mocked(sendViaSquads).mockReset();
    vi.mocked(sendViaSquadsSdk).mockReset();
    vi.mocked(broadcastSolanaTransaction).mockReset();
    vi.mocked(activeSquadsMode).mockReset();
    vi.mocked(buildSolanaDepositTx).mockResolvedValue(unsigned);
    vi.mocked(sendViaSquads).mockResolvedValue(pendingSquadsMultisigBroadcast({ vaultAddress: VAULT }));
    vi.mocked(sendViaSquadsSdk).mockResolvedValue(pendingSquadsMultisigBroadcast({ vaultAddress: VAULT }));
  });

  it("sends via SquadsX wrap when that wallet is connected", async () => {
    vi.mocked(activeSquadsMode).mockReturnValue("squadsx");
    await expect(broadcastBatchPayout({
      token: solToken,
      transaction: { approvals: null, callData: "", batch_contract: "", outputs: [{ address: "x", amount: "1", amountRaw: "1" }] },
      amountIn: 1n,
      payer: VAULT,
    })).resolves.toEqual(pendingSquadsMultisigBroadcast({ vaultAddress: VAULT }));
    expect(sendViaSquads).toHaveBeenCalledWith(unsigned);
    expect(sendViaSquadsSdk).not.toHaveBeenCalled();
    expect(broadcastSolanaTransaction).not.toHaveBeenCalled();
  });

  it("sends via the Squads SDK path and stays pending", async () => {
    vi.mocked(activeSquadsMode).mockReturnValue("sdk");
    await expect(broadcastBatchPayout({
      token: solToken,
      transaction: { approvals: null, callData: "", batch_contract: "", outputs: [{ address: "x", amount: "1", amountRaw: "1" }] },
      amountIn: 1n,
      payer: VAULT,
    })).resolves.toEqual(pendingSquadsMultisigBroadcast({ vaultAddress: VAULT }));
    expect(sendViaSquadsSdk).toHaveBeenCalledWith(unsigned);
    expect(sendViaSquads).not.toHaveBeenCalled();
    expect(broadcastSolanaTransaction).not.toHaveBeenCalled();
  });
});
