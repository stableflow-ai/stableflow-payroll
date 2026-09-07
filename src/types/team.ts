export interface TeamMemberWallets {
  evm: string;
  solana: string;
  near: string;
  tron: string;
}

export interface TeamMember {
  id: number;
  name: string;
  position: string;
  email: string;
  wallets: TeamMemberWallets;
}

export interface TeamMemberWrite {
  name: string;
  position: string;
  email: string;
  wallets: TeamMemberWallets;
}

export interface TeamMembersQuery {
  organizationId: number;
  page: number;
  pageSize: number;
  q?: string;
}

export interface TeamMembersPage {
  list: TeamMember[];
  total: number;
  totalPage: number;
}

export const TEAM_BOOK_PAGE_SIZE = 20;
