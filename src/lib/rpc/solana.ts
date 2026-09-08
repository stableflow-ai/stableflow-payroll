import { Connection, type ConnectionConfig } from "@solana/web3.js";
import { isProxyRpcUrl, rpcUrlsFor } from "./chain-rpc";
import { generateRpcSignature } from "./signature";

const ACTIVE_CONNECTION_PROP = "__stableflowActiveConnection";

type RpcWebSocket = {
  connect?: () => void;
  close?: () => void;
};

type ConnectionWithSocket = Connection & {
  _rpcWebSocket?: RpcWebSocket;
};

const isRpcUnavailableError = (error: unknown) => {
  const message = (error as Error)?.message?.toLowerCase?.() || "";
  return (
    message.includes("fetch")
    || message.includes("timeout")
    || message.includes("failed to fetch")
    || message.includes("expired timestamp")
    || message.includes("503")
    || message.includes("429")
    || message.includes("403")
    || message.includes("401")
    || message.includes("network")
  );
};

function signedFetch(url: string): ConnectionConfig["fetch"] {
  if (!isProxyRpcUrl(url)) return undefined;
  return (input, init) => {
    const { headers } = generateRpcSignature("solana");
    const merged = new Headers(init?.headers);
    merged.set("x-hmac-signature", headers["x-hmac-signature"]);
    merged.set("x-timestamp", headers["x-timestamp"]);
    return fetch(input, { ...init, headers: merged });
  };
}

function connectionConfigFor(url: string): ConnectionConfig {
  return { commitment: "confirmed", fetch: signedFetch(url) };
}

/**
 * The HMAC proxy (and some public HTTP RPCs) do not speak WebSocket.
 * @solana/web3.js still rewrites https → wss and retries forever, which spams
 * the console and can stall confirmTransaction's signature subscription.
 */
export function disableSolanaWebsocket(connection: Connection): Connection {
  const socket = (connection as ConnectionWithSocket)._rpcWebSocket;
  try {
    socket?.close?.();
  } catch {
    // The socket may never have opened on an HTTP-only endpoint.
  }
  if (socket) {
    socket.connect = () => undefined;
  }
  return connection;
}

/**
 * Unwrap the fallback proxy to the endpoint that answered last.
 * Sending a transaction to a different node than the one that issued the
 * blockhash is a known way to lose it.
 */
export function getActiveSolanaConnection(connection: Connection): Connection {
  const active = (connection as unknown as Record<string, Connection | undefined>)[ACTIVE_CONNECTION_PROP];
  return active ?? connection;
}

export function createSolanaHttpConnection(url: string): Connection {
  return disableSolanaWebsocket(new Connection(url, connectionConfigFor(url)));
}

export function createSolanaFallbackConnection(): Connection {
  const rpcUrls = rpcUrlsFor("sol");
  if (!rpcUrls.length) throw new Error("No Solana RPC URLs configured");

  const connections = rpcUrls.map(createSolanaHttpConnection);
  let activeIndex = 0;
  let active = connections[activeIndex];

  return new Proxy(connections[0], {
    get(_, prop, receiver) {
      if (prop === ACTIVE_CONNECTION_PROP) return active;

      const activeValue = Reflect.get(active, prop, receiver);
      if (typeof activeValue !== "function") return activeValue;

      return (...args: unknown[]) => {
        const callAtIndex = (index: number) => {
          const method = (connections[index] as unknown as Record<string | symbol, unknown>)[prop];
          if (typeof method !== "function") return method;
          return (method as (...inner: unknown[]) => unknown).apply(connections[index], args);
        };

        const tryWithFallback = async () => {
          let index = activeIndex;
          let attempts = 0;
          let lastError: unknown = null;
          while (attempts < connections.length) {
            try {
              const result = await callAtIndex(index);
              activeIndex = index;
              active = connections[activeIndex];
              return result;
            } catch (error) {
              lastError = error;
              if (!isRpcUnavailableError(error)) throw error;
              index = (index + 1) % connections.length;
              attempts += 1;
            }
          }
          throw lastError;
        };

        return tryWithFallback();
      };
    },
  }) as Connection;
}

let shared: Connection | null = null;

export function getSolanaConnection(): Connection {
  if (!shared) shared = createSolanaFallbackConnection();
  return shared;
}

export function solanaPrimaryRpcUrl(): string {
  return rpcUrlsFor("sol")[0] || "https://solana-rpc.publicnode.com";
}
