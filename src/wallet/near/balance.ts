import { nearViewFunction } from "@/lib/rpc/near";

export async function readNearFtBalance(opts: {
  tokenContract: string;
  owner: string;
}): Promise<bigint> {
  const raw = await nearViewFunction<string>(opts.tokenContract, "ft_balance_of", {
    account_id: opts.owner,
  });
  if (raw == null) return 0n;
  try {
    return BigInt(raw);
  } catch {
    return 0n;
  }
}
