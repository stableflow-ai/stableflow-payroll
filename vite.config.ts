/**
 * Vite 8 + Rolldown. Polyfills follow stableflow-x:
 * custom pre plugin strips trailing-slash Node builtin imports, then exact-match
 * file aliases replace vite-plugin-node-polyfills (incompatible with Rolldown).
 */
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const bufferEntry = require.resolve("buffer/");
const processEntry = require.resolve("process/browser.js");
const streamEntry = require.resolve("stream-browserify");
const utilEntry = require.resolve("util/");
const eventsEntry = require.resolve("events/");

/**
 * Strip trailing slashes on Node builtin polyfill imports so Rolldown does not
 * treat `buffer/` as a folder mapping against a file replacement.
 */
function normalizeNodeBuiltinImports(): Plugin {
  const bare = new Set([
    "buffer",
    "process",
    "stream",
    "util",
    "events",
    "node:buffer",
    "node:process",
    "node:stream",
    "node:util",
    "node:events",
  ]);
  return {
    name: "normalize-node-builtin-trailing-slash",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!source.endsWith("/")) return;
      const withoutSlash = source.slice(0, -1);
      if (!bare.has(withoutSlash)) return;
      return this.resolve(withoutSlash, importer, { ...options, skipSelf: true });
    },
  };
}

export default defineConfig({
  plugins: [normalizeNodeBuiltinImports(), react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(__dirname, "src"),
      },
      { find: /^buffer$/, replacement: bufferEntry },
      { find: /^node:buffer$/, replacement: bufferEntry },
      { find: /^process$/, replacement: processEntry },
      { find: /^node:process$/, replacement: processEntry },
      { find: /^stream$/, replacement: streamEntry },
      { find: /^node:stream$/, replacement: streamEntry },
      { find: /^util$/, replacement: utilEntry },
      { find: /^node:util$/, replacement: utilEntry },
      { find: /^events$/, replacement: eventsEntry },
      { find: /^node:events$/, replacement: eventsEntry },
    ],
  },
  define: {
    global: "globalThis",
    "process.env": "{}",
    "process.browser": "true",
  },
  optimizeDeps: {
    rolldownOptions: {
      transform: {
        define: {
          global: "globalThis",
          "process.env": "{}",
          "process.browser": "true",
        },
      },
    },
    include: [
      "buffer",
      "process",
      "stream-browserify",
      "util",
      "events",
      "@solana/web3.js",
      "@solana/spl-token",
    ],
    force: true,
  },
  build: {
    reportCompressedSize: false,
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173,
    host: "127.0.0.1",
    // When a real API is wired, the client calls VITE_API_BASE_URL directly (no proxy).
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
