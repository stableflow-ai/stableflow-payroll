import { afterEach, describe, expect, it, vi } from "vitest";
import { messageFactory } from "@defuse-protocol/internal-utils";
import { PHANTOM_SIGN_DISPLAY } from "./config";
import {
  createSolanaEmptyIntentBytes,
  formatSolanaSignedData,
  signSolanaIntentsMessage,
} from "./sign-intents-message";

const SIGNER_ID = "bb90d4c07e1e767a08b709d5b84b8315e6cfb8feb48ae1979063cbc3555b53b2";
const SOLANA_ADDRESS = "DdBL57BmnE2LyqtZS6MxGDmZ1MozVMhf1iQEzpTF4v2m";
const DEADLINE_MS = Date.UTC(2026, 7, 27, 12, 0, 0);
const NONCE = new Uint8Array(32).fill(3);

/** Captured from near-intents.org Phantom empty-intents auth. */
const NEAR_COM_DEADLINE = "2026-08-27T10:58:22.267Z";
const NEAR_COM_NONCE_B64 = "Vij2xgAlKBKzwKQDXF6kzxjA7J6CGKTPGAs8kmuB+zo=";
const NEAR_COM_PAYLOAD = `{"signer_id":"${SIGNER_ID}","verifying_contract":"intents.near","deadline":"${NEAR_COM_DEADLINE}","nonce":"${NEAR_COM_NONCE_B64}","intents":[]}`;

describe("createSolanaEmptyIntentBytes", () => {
  it("matches the official empty-intents Solana payload, including ISO deadline", () => {
    const bytes = createSolanaEmptyIntentBytes({
      signerId: SIGNER_ID,
      deadlineMs: DEADLINE_MS,
      nonce: NONCE,
    });
    const official = messageFactory.makeEmptyMessage({
      signerId: SIGNER_ID as Parameters<typeof messageFactory.makeEmptyMessage>[0]["signerId"],
      deadlineTimestamp: DEADLINE_MS,
      nonce: NONCE,
    }).SOLANA.message;
    const payload = new TextDecoder().decode(bytes);

    expect(payload).toBe(new TextDecoder().decode(official));
    expect(JSON.parse(payload)).toMatchObject({
      signer_id: SIGNER_ID,
      verifying_contract: "intents.near",
      deadline: new Date(DEADLINE_MS).toISOString(),
      intents: [],
    });
    expect(typeof JSON.parse(payload).deadline).toBe("string");
  });

  it("byte-matches the near.com Phantom empty-intents payload", () => {
    const nonce = Uint8Array.from(Buffer.from(NEAR_COM_NONCE_B64, "base64"));
    const bytes = createSolanaEmptyIntentBytes({
      signerId: SIGNER_ID,
      deadlineMs: Date.parse(NEAR_COM_DEADLINE),
      nonce,
    });
    expect(new TextDecoder().decode(bytes)).toBe(NEAR_COM_PAYLOAD);
  });
});

describe("formatSolanaSignedData", () => {
  it("prefixes the Solana base58 address as public_key", () => {
    const message = createSolanaEmptyIntentBytes({
      signerId: SIGNER_ID,
      deadlineMs: DEADLINE_MS,
      nonce: NONCE,
    });
    const signature = new Uint8Array(64).fill(9);
    const signed = formatSolanaSignedData(signature, message, SOLANA_ADDRESS);
    if (signed.standard !== "raw_ed25519") {
      throw new Error(`expected raw_ed25519, got ${signed.standard}`);
    }

    expect(signed.public_key).toBe(`ed25519:${SOLANA_ADDRESS}`);
    expect(signed.payload).toBe(new TextDecoder().decode(message));
    expect(signed.signature.startsWith("ed25519:")).toBe(true);
  });
});

describe("signSolanaIntentsMessage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("signs with Phantom utf8 when the injected provider is present", async () => {
    const message = new Uint8Array([1, 2, 3]);
    const phantomSignature = new Uint8Array(64).fill(4);
    const signMessage = vi.fn(async () => ({ signature: phantomSignature }));
    const adapterSignMessage = vi.fn(async () => new Uint8Array(64).fill(5));
    vi.stubGlobal("window", {
      phantom: { solana: { isPhantom: true, signMessage } },
    });

    await expect(signSolanaIntentsMessage(message, adapterSignMessage)).resolves.toBe(phantomSignature);
    expect(signMessage).toHaveBeenCalledWith(message, PHANTOM_SIGN_DISPLAY);
    expect(adapterSignMessage).not.toHaveBeenCalled();
  });

  it("falls back to the wallet adapter when Phantom is not present", async () => {
    const message = new Uint8Array([7, 8]);
    const adapterSignature = new Uint8Array(64).fill(6);
    const adapterSignMessage = vi.fn(async () => adapterSignature);
    vi.stubGlobal("window", {});

    await expect(signSolanaIntentsMessage(message, adapterSignMessage)).resolves.toBe(adapterSignature);
    expect(adapterSignMessage).toHaveBeenCalledWith(message);
  });

  it("throws when neither Phantom nor the adapter can sign", async () => {
    vi.stubGlobal("window", {});
    await expect(signSolanaIntentsMessage(new Uint8Array([1]))).rejects.toThrow(
      "Connected Solana wallet does not support message signing",
    );
  });
});
