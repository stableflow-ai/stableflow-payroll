/**
 * Send origin tokens to the 1Click deposit address returned by single swap.
 */

import { isNativeToken, type IntentsToken } from "@/stores/intents-tokens";
import { transferErc20, transferNativeEvm } from "./evm/transfer";
import { transferFt, transferNativeNear } from "./near/transfer";
import { transferNativeSol, transferSpl } from "./solana/transfer";
import { transferNativeTrx, transferTrc20 } from "./tron/transfer";

export async function transferToDepositAddress(input: {
  token: IntentsToken;
  depositAddress: string;
  amountIn: bigint;
}): Promise<string> {
  const { token, depositAddress, amountIn } = input;
  const to = depositAddress.trim();
  if (!to) throw new Error("Missing deposit address");
  if (amountIn <= 0n) throw new Error("Invalid transfer amount");

  const kind = token.chain.chainKind;
  const native = isNativeToken(token);

  if (kind === "evm") {
    const chainId = token.chain.chainId;
    if (!chainId) throw new Error("Missing EVM chain id");
    if (native) {
      return transferNativeEvm({ chainId, to, amountIn });
    }
    if (!token.contractAddress) throw new Error("Missing token contract address");
    return transferErc20({
      chainId,
      tokenAddress: token.contractAddress,
      to,
      amountIn,
    });
  }

  if (kind === "solana") {
    if (native) return transferNativeSol({ to, amountIn });
    if (!token.contractAddress) throw new Error("Missing token mint");
    return transferSpl({ mint: token.contractAddress, to, amountIn });
  }

  if (kind === "near") {
    if (native) return transferNativeNear({ to, amountIn });
    if (!token.contractAddress) throw new Error("Missing token contract");
    return transferFt({ tokenContract: token.contractAddress, to, amountIn });
  }

  if (kind === "tron") {
    if (native) return transferNativeTrx({ to, amountIn });
    if (!token.contractAddress) throw new Error("Missing token contract");
    return transferTrc20({ contractAddress: token.contractAddress, to, amountIn });
  }

  throw new Error(`Unsupported origin chain: ${kind}`);
}
