/**
 * Tron native and TRC-20 balance helpers.
 */

import { TronWeb } from "tronweb";
import { getTronWeb } from "@/lib/rpc/tron";

export function parseTronUint256(raw: unknown): bigint {
  if (raw == null) return 0n;
  if (typeof raw === "bigint") return raw >= 0n ? raw : 0n;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) return 0n;
    return BigInt(Math.trunc(raw));
  }
  if (Array.isArray(raw)) return parseTronUint256(raw[0]);
  if (typeof raw === "object") {
    const hex = (raw as { _hex?: unknown })._hex;
    if (typeof hex === "string") return parseTronUint256(hex);
    if (typeof (raw as { toString?: unknown }).toString === "function") {
      const text = (raw as { toString: () => string }).toString();
      if (text && text !== "[object Object]") return parseTronUint256(text);
    }
    return 0n;
  }
  const text = String(raw).trim();
  if (!text) return 0n;
  try {
    if (/^0x[0-9a-f]*$/i.test(text)) return text === "0x" ? 0n : BigInt(text);
    if (/^[0-9a-f]+$/i.test(text) && (text.length === 64 || /[a-f]/i.test(text))) {
      return BigInt(`0x${text}`);
    }
    if (/^\d+$/.test(text)) return BigInt(text);
    return 0n;
  } catch {
    return 0n;
  }
}

export function normalizeTronAddress(address: string): string | null {
  const raw = address.trim();
  if (!raw) return null;
  try {
    if (TronWeb.isAddress(raw)) {
      return TronWeb.address.fromHex(TronWeb.address.toHex(raw));
    }
    const body = raw.replace(/^0x/i, "");
    const hex = /^41[0-9a-f]{40}$/i.test(body)
      ? body
      : /^[0-9a-f]{40}$/i.test(body)
        ? `41${body}`
        : "";
    if (!hex) return null;
    const base58 = TronWeb.address.fromHex(hex);
    return TronWeb.isAddress(base58) ? base58 : null;
  } catch {
    return null;
  }
}

async function readTrc20Uint256(opts: {
  tokenContract: string;
  owner: string;
  functionSelector: string;
  parameters: { type: string; value: string }[];
}): Promise<bigint> {
  const contract = normalizeTronAddress(opts.tokenContract);
  const owner = normalizeTronAddress(opts.owner);
  if (!contract || !owner) return 0n;
  const parameters: { type: string; value: string }[] = [];
  for (const parameter of opts.parameters) {
    if (parameter.type !== "address") {
      parameters.push(parameter);
      continue;
    }
    const value = normalizeTronAddress(parameter.value);
    if (!value) return 0n;
    parameters.push({ type: "address", value });
  }
  try {
    const tronWeb = getTronWeb();
    tronWeb.setAddress(owner);
    const result = await tronWeb.transactionBuilder.triggerConstantContract(
      contract,
      opts.functionSelector,
      {},
      parameters,
      owner,
    );
    const raw = (result as { constant_result?: unknown[] }).constant_result?.[0]
      ?? (result as { constantResult?: unknown[] }).constantResult?.[0];
    return parseTronUint256(raw);
  } catch {
    return 0n;
  }
}

export async function readNativeTrxBalance(opts: { owner: string }): Promise<bigint> {
  const tronWeb = getTronWeb();
  tronWeb.setAddress(opts.owner);
  const raw = await tronWeb.trx.getBalance(opts.owner);
  return BigInt(raw);
}

export async function readTrc20Balance(opts: {
  tokenContract: string;
  owner: string;
}): Promise<bigint> {
  return readTrc20Uint256({
    tokenContract: opts.tokenContract,
    owner: opts.owner,
    functionSelector: "balanceOf(address)",
    parameters: [{ type: "address", value: opts.owner }],
  });
}

export async function readTrc20Allowance(opts: {
  tokenContract: string;
  owner: string;
  spender: string;
}): Promise<bigint> {
  return readTrc20Uint256({
    tokenContract: opts.tokenContract,
    owner: opts.owner,
    functionSelector: "allowance(address,address)",
    parameters: [
      { type: "address", value: opts.owner },
      { type: "address", value: opts.spender },
    ],
  });
}
