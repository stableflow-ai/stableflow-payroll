import {
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/rpc/solana";
import { SOLANA_ATA_ALLOW_OWNER_OFF_CURVE } from "./config";

export function getSolanaRpcConnection() {
  return getSolanaConnection();
}

export async function readNativeSolBalance(opts: { owner: string }): Promise<bigint> {
  const connection = getSolanaRpcConnection();
  const raw = await connection.getBalance(new PublicKey(opts.owner));
  return BigInt(raw);
}

export async function readSplBalance(opts: {
  tokenMint: string;
  owner: string;
}): Promise<bigint> {
  const connection = getSolanaRpcConnection();
  const mint = new PublicKey(opts.tokenMint);
  const owner = new PublicKey(opts.owner);
  const info = await connection.getAccountInfo(mint);
  const programId = info?.owner.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const ata = getAssociatedTokenAddressSync(mint, owner, SOLANA_ATA_ALLOW_OWNER_OFF_CURVE, programId);
  try {
    const account = await getAccount(connection, ata, "confirmed", programId);
    return BigInt(account.amount);
  } catch {
    return 0n;
  }
}
