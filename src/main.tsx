import { Buffer } from "buffer";
import process from "process";
import "./styles.css";

/**
 * ESM hoists every static import, so hanging Buffer in this file's body does
 * not run before WalletProvider / Solana SDK modules. Those packages read the
 * global Buffer at load time (`@solana/spl-token-metadata`). Keep this file's
 * static imports limited to buffer/process/CSS, assign globals, then load the
 * app graph dynamically.
 */
const globalRef = globalThis as typeof globalThis & {
  Buffer: typeof Buffer;
  process: typeof process;
};
globalRef.Buffer = Buffer;
globalRef.process = process;

const [
  { QueryClientProvider },
  { queryClient },
  { StrictMode },
  { createRoot },
  { default: App },
  { WalletProvider },
] = await Promise.all([
  import("@tanstack/react-query"),
  import("./lib/query-client"),
  import("react"),
  import("react-dom/client"),
  import("./App"),
  import("./wallet"),
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <App />
      </WalletProvider>
    </QueryClientProvider>
  </StrictMode>,
);
