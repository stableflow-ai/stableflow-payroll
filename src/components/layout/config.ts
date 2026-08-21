import type { ChainKind, ChainOwners } from "@/wallet/types";

export const HEADER_AVATAR_SRC = "/avatar/avatar-1.png";
export const HEADER_NAV_ACTIVE_COLOR = "#4DA0FF";

export const HEADER_NAV_ITEMS = [
  { label: "Home", to: "/" },
  { label: "Pay", to: "/pay" },
  { label: "Analytics", to: "/analytics" },
  { label: "Developer", to: "/partner/docs" },
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
  if (owners.evm) return "evm";
  if (owners.solana) return "solana";
  if (owners.near) return "near";
  if (owners.tron) return "tron";
  return null;
}
