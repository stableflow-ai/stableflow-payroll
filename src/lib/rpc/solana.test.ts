import { describe, expect, it, vi } from "vitest";
import { Connection } from "@solana/web3.js";
import {
  disableSolanaWebsocket,
  getActiveSolanaConnection,
} from "./solana";

const ACTIVE_CONNECTION_PROP = "__stableflowActiveConnection";

describe("disableSolanaWebsocket", () => {
  it("closes the socket and ignores later connect calls", () => {
    const connect = vi.fn();
    const close = vi.fn();
    const connection = { _rpcWebSocket: { connect, close } } as unknown as Connection;

    disableSolanaWebsocket(connection);
    expect(close).toHaveBeenCalledTimes(1);

    (connection as unknown as { _rpcWebSocket: { connect: () => void } })._rpcWebSocket.connect();
    expect(connect).not.toHaveBeenCalled();
  });

  it("does not throw when the socket was never opened", () => {
    const connection = {
      _rpcWebSocket: {
        close: () => {
          throw new Error("not connected");
        },
      },
    } as unknown as Connection;

    expect(() => disableSolanaWebsocket(connection)).not.toThrow();
  });
});

describe("getActiveSolanaConnection", () => {
  it("unwraps the fallback proxy to the last successful endpoint", () => {
    const inner = { rpcEndpoint: "https://active.example" } as Connection;
    const wrapped = new Proxy({} as Connection, {
      get(_, prop) {
        if (prop === ACTIVE_CONNECTION_PROP) return inner;
        return undefined;
      },
    });

    expect(getActiveSolanaConnection(wrapped)).toBe(inner);
  });

  it("returns the connection itself when it is not a fallback proxy", () => {
    const connection = { rpcEndpoint: "https://plain.example" } as Connection;
    expect(getActiveSolanaConnection(connection)).toBe(connection);
  });
});
