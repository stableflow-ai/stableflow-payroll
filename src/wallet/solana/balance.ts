import {
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/rpc/solana";

export function getSolanaRpcConnection() {
  return getSolanaConnection();
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
  const ata = getAssociatedTokenAddressSync(mint, owner, false, programId);
  try {
    const account = await getAccount(connection, ata, "confirmed", programId);
    return BigInt(account.amount);
  } catch {
    return 0n;
  }
}
