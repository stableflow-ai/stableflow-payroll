/**
 * Wrap WalletConnect connectors so `switchChain` fails fast when the session
 * never authorized the requested chain.
 *
 * RainbowKit's `connect()` always passes a `chainId` (often mainnet). wagmi then
 * calls `switchChain` if that id does not match the wallet's current chain. A Safe
 * only authorizes its own chain and never answers `wallet_switchEthereumChain`, so
 * the unguarded `switchChain` hangs forever.
 *
 * Throwing is the correct outcome: wagmi's `connect()` only rethrows code 4001
 * (user rejected) and swallows every other error, returning `{ id: currentChainId }`.
 * `SwitchChainError` is code 4902, so connect still completes on the Safe's chain.
 * Explicit `switchChain(wagmiConfig, ...)` from our own code fails quickly instead
 * of hanging.
 */

import { SwitchChainError } from "viem";
import type { CreateConnectorFn } from "wagmi";

const SWITCH_CHAIN_GUARD_TIMEOUT_MS = 12_000;

type WalletConnectSessionProvider = {
  session?: {
    namespaces?: {
      eip155?: {
        accounts?: readonly string[];
      };
    };
  };
};

function authorizedChainIds(provider: unknown): Set<number> {
  const accounts = (provider as WalletConnectSessionProvider | undefined)?.session?.namespaces?.eip155?.accounts ?? [];
  const ids = new Set<number>();
  for (const account of accounts) {
    const chainId = Number(account.split(":")[1]);
    if (Number.isFinite(chainId)) ids.add(chainId);
  }
  return ids;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new SwitchChainError(new Error("Wallet did not confirm the chain change")));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function guardSwitchChain(createConnector: CreateConnectorFn): CreateConnectorFn {
  return (config) => {
    const connector = createConnector(config);
    if (connector.type !== "walletConnect") return connector;
    const originalSwitchChain = connector.switchChain?.bind(connector);
    if (!originalSwitchChain) return connector;
    return {
      ...connector,
      async switchChain(parameters) {
        const provider = await connector.getProvider();
        const authorized = authorizedChainIds(provider);
        if (authorized.size > 0 && !authorized.has(parameters.chainId)) {
          throw new SwitchChainError(
            new Error("Requested chain is not authorized in this WalletConnect session"),
          );
        }
        return withTimeout(originalSwitchChain(parameters), SWITCH_CHAIN_GUARD_TIMEOUT_MS);
      },
    };
  };
}
