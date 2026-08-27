/**
 * Tron native and TRC-20 balance helpers.
 */

import { getTronWeb } from "@/lib/rpc/tron";

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
  const tronWeb = getTronWeb();
  tronWeb.setAddress(opts.owner);
  const contract = await tronWeb.contract().at(opts.tokenContract);
  const raw = await contract.balanceOf(opts.owner).call();
  if (raw == null) return 0n;
  try {
    return BigInt(raw.toString());
  } catch {
    return 0n;
  }
}
