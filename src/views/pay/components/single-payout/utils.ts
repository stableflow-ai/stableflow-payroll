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

function contactWallets(contact: Contact): string[] {
  if (contact.wallets) {
    return [
      contact.wallets.evm,
      contact.wallets.solana,
      contact.wallets.near,
      contact.wallets.tron,
    ]
      .map((value) => value.trim())
      .filter(Boolean);
  }
  const wallet = contact.wallet.trim();
  return wallet ? [wallet] : [];
}

export type RecipientSuggestion = {
  id: string;
  contact: Contact;
  wallet: string;
};

export function contactWalletSuggestions(contacts: readonly Contact[]): RecipientSuggestion[] {
  const rows: RecipientSuggestion[] = [];
  for (const contact of contacts) {
    const seen = new Set<string>();
    for (const wallet of contactWallets(contact)) {
      const key = wallet.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        id: `${contact.id}:${wallet}`,
        contact: { ...contact, wallet },
        wallet,
      });
    }
  }
  return rows;
}

export function filterContactSuggestions(
  suggestions: readonly RecipientSuggestion[],
  query: string,
): RecipientSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return suggestions.filter((row) => (
    row.contact.name.toLowerCase().includes(q)
    || row.wallet.toLowerCase().includes(q)
  ));
}

export function uniqueRecipientSuggestion(
  suggestions: readonly RecipientSuggestion[],
  total: number | null,
): RecipientSuggestion | null {
  if (suggestions.length !== 1) return null;
  if (total != null && total !== 1) return null;
  return suggestions[0] ?? null;
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
