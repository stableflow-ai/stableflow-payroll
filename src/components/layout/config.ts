import { FIXED_CHAIN_KINDS } from "@/config/chains";
import type { ChainKind, ChainOwners } from "@/wallet/types";

export const HEADER_AVATAR_SRC = "/avatar/avatar-1.png";
export const HEADER_NAV_ACTIVE_COLOR = "#0054D2";

export const HEADER_NAV_ITEMS = [
  { label: "Home", to: "/" },
  { label: "Pay", to: "/pay" },
  { label: "Analytics", to: "/analytics" },
  { label: "Partner", to: "/partner" },
] as const;

export const HEADER_CHAIN_LOGO: Record<ChainKind, string> = {
  evm: "ethereum",
  near: "near",
  solana: "solana",
  tron: "tron",
};

export function isHeaderNavActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function primaryConnectedKind(owners: ChainOwners): ChainKind | null {
  if (owners.evm && FIXED_CHAIN_KINDS.has("evm")) return "evm";
  if (owners.solana && FIXED_CHAIN_KINDS.has("solana")) return "solana";
  if (owners.near && FIXED_CHAIN_KINDS.has("near")) return "near";
  if (owners.tron && FIXED_CHAIN_KINDS.has("tron")) return "tron";
  return null;
}
