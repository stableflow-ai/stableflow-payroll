/**
 * Tron native TRX and TRC-20 transfers to a deposit address.
 */

import { getTronWeb } from "@/lib/rpc/tron";
import { getTronSigner } from "./session";

function requireSigner() {
  const signer = getTronSigner();
  if (!signer) throw new Error("Connect a Tron wallet to send this payout");
  return signer;
}

async function broadcastSigned(unsigned: unknown): Promise<string> {
  const signer = requireSigner();
  const tronWeb = getTronWeb();
  tronWeb.setAddress(signer.address);
  const signed = await signer.signTransaction(unsigned as Parameters<typeof signer.signTransaction>[0]);
  const result = await tronWeb.trx.sendRawTransaction(signed);
  const hash = (result as { txid?: string; transaction?: { txID?: string } })?.txid
    || (result as { transaction?: { txID?: string } })?.transaction?.txID;
  if (!hash) throw new Error("Tron wallet did not return a transaction hash");
  return hash;
}

export async function transferNativeTrx(input: {
  to: string;
  amountIn: bigint;
}): Promise<string> {
  const signer = requireSigner();
  const tronWeb = getTronWeb();
  tronWeb.setAddress(signer.address);
  const transaction = await tronWeb.transactionBuilder.sendTrx(
    input.to,
    Number(input.amountIn),
    signer.address,
  );
  return broadcastSigned(transaction);
}

export async function transferTrc20(input: {
  contractAddress: string;
  to: string;
  amountIn: bigint;
}): Promise<string> {
  const signer = requireSigner();
  const tronWeb = getTronWeb();
  tronWeb.setAddress(signer.address);
  const tx = await tronWeb.transactionBuilder.triggerSmartContract(
    input.contractAddress,
    "transfer(address,uint256)",
    {},
    [
      { type: "address", value: input.to },
      { type: "uint256", value: input.amountIn.toString() },
    ],
    signer.address,
  );
  const transaction = (tx as { transaction?: unknown }).transaction ?? tx;
  return broadcastSigned(transaction);
}
