import { Buffer } from "buffer";
import bs58 from "bs58";

export const INTENTS_RECIPIENT = "intents.near";
export const INTENT_SIGN_TTL_MS = 5 * 60_000;

/** Opaque 32 random bytes. 1Click / Intents auth requires a versioned nonce instead. */
export function randomNonce(): Uint8Array {
  const nonce = new Uint8Array(32);
  crypto.getRandomValues(nonce);
  return nonce;
}

export function nonceToBase64(nonce: Uint8Array): string {
  return Buffer.from(nonce).toString("base64");
}

export function isoDeadline(deadlineMs: number): string {
  return new Date(deadlineMs).toISOString();
}

export function buildNep413Message(signerId: string, deadlineIso: string): string {
  return JSON.stringify({ deadline: deadlineIso, intents: [], signer_id: signerId });
}

export function buildEvmFamilyPayload(signerId: string, nonceB64: string, deadlineIso: string): string {
  return JSON.stringify({
    signer_id: signerId,
    verifying_contract: INTENTS_RECIPIENT,
    deadline: deadlineIso,
    nonce: nonceB64,
    intents: [],
  });
}

/**
 * Convert a 65-byte hex signature (v often 27/28) into `secp256k1:` + base58
 * with recovery byte normalized to {0,1}.
 */
export function encodeSecp256k1Signature(hexSignature: string): string {
  const clean = hexSignature.startsWith("0x") ? hexSignature.slice(2) : hexSignature;
  if (clean.length !== 130) {
    throw new Error(`Expected a 65-byte signature, got ${clean.length / 2} bytes`);
  }
  const r = clean.slice(0, 64);
  const s = clean.slice(64, 128);
  let v = parseInt(clean.slice(128, 130), 16);
  if (Number.isNaN(v)) throw new Error("Invalid signature recovery byte");
  if (v >= 27) v -= 27;
  if (v !== 0 && v !== 1) throw new Error("Signature recovery byte must be 0 or 1");
  const bytes = new Uint8Array(65);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(r.slice(i * 2, i * 2 + 2), 16);
    bytes[32 + i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  }
  bytes[64] = v;
  return `secp256k1:${bs58.encode(bytes)}`;
}

export function encodeEd25519(value: string | Uint8Array): string {
  if (typeof value !== "string") return `ed25519:${bs58.encode(value)}`;
  if (value.startsWith("ed25519:")) return value;
  try {
    const bytes = Buffer.from(value, "base64");
    if (bytes.length === 32 || bytes.length === 64) {
      return `ed25519:${bs58.encode(bytes)}`;
    }
  } catch {
    // Fall through and treat the string as raw base58.
  }
  return `ed25519:${value}`;
}

export function walletDoesNotSupportSigning(kind: string): Error {
  return new Error(`Connected ${kind} wallet does not support message signing`);
}

export function payloadAsText(payload: unknown): string {
  return typeof payload === "string" ? payload : JSON.stringify(payload);
}

function asRecord(payload: unknown): Record<string, unknown> | null {
  if (payload && typeof payload === "object") return payload as Record<string, unknown>;
  if (typeof payload !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(payload);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  return null;
}

export function parseNep413Payload(payload: unknown): {
  message: string;
  nonce: Uint8Array;
  recipient: string;
} {
  const record = asRecord(payload);
  if (!record || typeof record.message !== "string") {
    throw new Error("Invalid NEP-413 intent payload");
  }
  if (typeof record.nonce !== "string") {
    throw new Error("NEP-413 intent payload is missing a nonce");
  }
  return {
    message: record.message,
    nonce: Buffer.from(record.nonce, "base64"),
    recipient: typeof record.recipient === "string" ? record.recipient : INTENTS_RECIPIENT,
  };
}
