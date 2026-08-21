/**
 * Near RPC fallback. The HMAC proxy does not serve Near yet — when it does,
 * add a slug in chain-rpc.ts and inject headers the same way as evm.ts
 * (`onFetchRequest` / `generateRpcSignature(slug)`).
 */

import { rpcUrlsFor } from "./chain-rpc";

export async function nearViewFunction<T>(
  contractId: string,
  methodName: string,
  args: Record<string, unknown> = {},
): Promise<T | null> {
  const urls = rpcUrlsFor("near");
  let lastError: unknown = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "stableflow-pay",
          method: "query",
          params: {
            request_type: "call_function",
            finality: "final",
            account_id: contractId,
            method_name: methodName,
            args_base64: btoa(JSON.stringify(args)),
          },
        }),
      });
      if (!res.ok) {
        lastError = new Error(`Near RPC ${res.status}`);
        continue;
      }
      const json = await res.json() as {
        result?: { result?: number[] };
        error?: unknown;
      };
      if (json.error || !json.result?.result) {
        lastError = json.error || new Error("Empty Near RPC result");
        continue;
      }
      const text = new TextDecoder().decode(Uint8Array.from(json.result.result));
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as T;
      }
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}
