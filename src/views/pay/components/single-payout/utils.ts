import type { Contact } from "@/hooks/use-contacts";
import type { TeamMember, TeamMemberWallets } from "@/types/team";
import { sameAddress } from "@/utils";
import { detectAddressChainKind } from "../../utils";
import { memberDisplayWallet, walletForChainKind } from "../team/utils";

export function teamMemberToContact(member: TeamMember): Contact {
  const wallet = memberDisplayWallet(member) ?? "";
  const email = member.email.trim();
  return {
    id: String(member.id),
    name: member.name,
    wallet,
    email: email || null,
    wallets: member.wallets,
  };
}

export function teamMembersToContacts(members: readonly TeamMember[]): Contact[] {
  return members.map(teamMemberToContact);
}

export function matchContact(address: string, contacts: readonly Contact[]): Contact | null {
  const kind = detectAddressChainKind(address);
  if (!kind) return null;
  return contacts.find((row) => sameAddress(row.wallet, address, kind)) ?? null;
}

function memberWallets(member: TeamMember): string[] {
  return [
    member.wallets.evm,
    member.wallets.solana,
    member.wallets.near,
    member.wallets.tron,
  ]
    .map((value) => value.trim())
    .filter(Boolean);
}

export function teamMemberIdFromContact(contact: Contact | null | undefined): number | undefined {
  if (!contact) return undefined;
  const id = Number(contact.id);
  if (!Number.isInteger(id) || id <= 0) return undefined;
  return id;
}

export function matchPayNowMember(
  address: string,
  name: string,
  wallets: TeamMemberWallets,
  memberId: number,
  email?: string | null,
): Contact | null {
  const kind = detectAddressChainKind(address);
  if (!kind) return null;
  const wallet = walletForChainKind(wallets, kind);
  if (!wallet || !sameAddress(wallet, address, kind)) return null;
  const trimmed = email?.trim() ?? "";
  return {
    id: String(memberId),
    name,
    wallet,
    email: trimmed || null,
    wallets,
  };
}

export function matchTeamMember(
  address: string,
  members: readonly TeamMember[],
): Contact | null {
  const kind = detectAddressChainKind(address);
  if (!kind) return null;
  const member = members.find((row) =>
    memberWallets(row).some((wallet) => sameAddress(wallet, address, kind)),
  );
  return member ? teamMemberToContact(member) : null;
}
