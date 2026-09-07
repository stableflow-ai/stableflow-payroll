import type { Contact } from "@/hooks/use-contacts";
import type { TeamMember, TeamMemberWallets } from "@/types/team";
import { sameAddress } from "@/utils";
import { detectAddressChainKind } from "../../utils";
import { memberDisplayWallet, walletForChainKind } from "../team/utils";

export function teamMemberToContact(member: TeamMember): Contact | null {
  const wallet = memberDisplayWallet(member);
  if (!wallet) return null;
  const email = member.email.trim();
  return {
    id: String(member.id),
    name: member.name,
    wallet,
    email: email || null,
  };
}

export function teamMembersToContacts(members: readonly TeamMember[]): Contact[] {
  const contacts: Contact[] = [];
  for (const member of members) {
    const contact = teamMemberToContact(member);
    if (contact) contacts.push(contact);
  }
  return contacts;
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

export function matchPayNowMember(
  address: string,
  name: string,
  wallets: TeamMemberWallets,
): Contact | null {
  const kind = detectAddressChainKind(address);
  if (!kind) return null;
  const wallet = walletForChainKind(wallets, kind);
  if (!wallet || !sameAddress(wallet, address, kind)) return null;
  return {
    id: "pay-now",
    name,
    wallet,
    email: null,
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
