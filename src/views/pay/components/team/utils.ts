import { isAddressValid, type WalletChainKind } from "@/utils";
import { isValidEmail } from "../../utils";
import type { TeamMember, TeamMemberWallets } from "@/hooks/use-team-api";

export function memberDisplayWallet(member: Pick<TeamMember, "wallets">): string | null {
  const { evm, solana, near } = member.wallets;
  if (evm.trim()) return evm.trim();
  if (solana.trim()) return solana.trim();
  if (near.trim()) return near.trim();
  return null;
}

export function dash(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed || "-";
}

export function walletFieldError(value: string, kind: WalletChainKind): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isAddressValid(trimmed, kind) ? null : `Invalid ${kindLabel(kind)} address`;
}

function kindLabel(kind: WalletChainKind): string {
  if (kind === "near") return "NEAR";
  if (kind === "solana") return "Solana";
  if (kind === "tron") return "Tron";
  return "EVM";
}

export function emailFieldError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isValidEmail(trimmed) ? null : "Enter a valid email";
}

export function teamMemberFormCanSave(input: {
  name: string;
  email: string;
  wallets: TeamMemberWallets;
}): boolean {
  if (!input.name.trim()) return false;
  if (emailFieldError(input.email)) return false;
  if (walletFieldError(input.wallets.evm, "evm")) return false;
  if (walletFieldError(input.wallets.solana, "solana")) return false;
  if (walletFieldError(input.wallets.near, "near")) return false;
  return true;
}

export function memberMatchesSearch(member: TeamMember, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    member.name,
    member.email,
    member.position,
    member.wallets.evm,
    member.wallets.solana,
    member.wallets.near,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}
