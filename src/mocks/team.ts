export const TEAM_SCHEDULE = {
  Monthly: "Monthly",
  OneOff: "One off",
  OnDemand: "On Demand",
} as const;

export type TeamSchedule = (typeof TEAM_SCHEDULE)[keyof typeof TEAM_SCHEDULE] | "";

export type TeamMemberWallets = {
  evm: string;
  solana: string;
  near: string;
  tron: string;
};

export type TeamMember = {
  id: string;
  name: string;
  position: string;
  schedule: TeamSchedule;
  email: string;
  telegram: string;
  slack: string;
  wallets: TeamMemberWallets;
};

export type TeamMemberWrite = {
  name: string;
  position: string;
  email: string;
  telegram: string;
  slack: string;
  wallets: TeamMemberWallets;
};

export type TeamInviteWrite = {
  name: string;
  email: string;
  role: string;
};

const ADDR = {
  evmA: "0x557be3f47a45499385f60cd64e2ff455e42a3311",
  evmB: "0x541a9b0e0e1c2d3f4a5b6c7d8e9f0a1b2c3d8dc1",
  evmC: "0x253ef6020000000000000000000000000000ef02",
  nearA: "stableflow.near",
  nearB: "payroll.near",
  sol: "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn",
} as const;

function emptyWallets(): TeamMemberWallets {
  return { evm: "", solana: "", near: "", tron: "" };
}

function member(
  id: string,
  name: string,
  fields: Partial<Omit<TeamMember, "id" | "name" | "wallets">> & {
    wallets?: Partial<TeamMemberWallets>;
  } = {},
): TeamMember {
  return {
    id,
    name,
    position: fields.position ?? "",
    schedule: fields.schedule ?? TEAM_SCHEDULE.Monthly,
    email: fields.email ?? "",
    telegram: fields.telegram ?? "",
    slack: fields.slack ?? "",
    wallets: { ...emptyWallets(), ...fields.wallets },
  };
}

const INITIAL_MEMBERS: TeamMember[] = [
  member("member-1", "Andrew", {
    position: "BD",
    email: "andrew@gmail.com",
    wallets: { evm: ADDR.evmA },
  }),
  member("member-2", "Hannah Petty", {
    email: "hannah@gmail.com",
    wallets: { evm: ADDR.evmB },
  }),
  member("member-3", "Albert", {
    email: "albert@gmail.com",
  }),
  member("member-4", "Zoey", {
    position: "Contractors",
    schedule: TEAM_SCHEDULE.OneOff,
    wallets: { evm: ADDR.evmC },
  }),
  member("member-5", "Tai Verdes", {
    position: "Engineer",
    email: "taivendes@gmail.com",
    wallets: { evm: ADDR.evmA, solana: ADDR.sol },
  }),
  member("member-6", "Tai Verdes", {
    position: "Engineer",
    email: "taiv@gmail.com",
    wallets: { evm: ADDR.evmB },
  }),
  member("member-7", "Big Z", {
    position: "Community Leader",
    schedule: TEAM_SCHEDULE.OnDemand,
    email: "bigz@gmail.com",
    wallets: { evm: ADDR.evmC },
  }),
  member("member-8", "Albert Huang", {
    email: "alberthuang@gmail.com",
    wallets: { evm: ADDR.evmA },
  }),
  member("member-9", "Zoey Zhang", {
    position: "QA",
    email: "zoeyz@gmail.com",
    wallets: { evm: ADDR.evmB, near: ADDR.nearA },
  }),
  member("member-10", "Tai Verdes", {
    email: "tai@gmail.com",
    wallets: { evm: ADDR.evmC },
  }),
  member("member-11", "Maya Chen", {
    position: "Product",
    email: "maya@gmail.com",
    wallets: { near: ADDR.nearA },
  }),
  member("member-12", "Leo Park", {
    position: "Engineer",
    schedule: TEAM_SCHEDULE.OneOff,
    email: "leo@gmail.com",
    wallets: { solana: ADDR.sol },
  }),
  member("member-13", "Nina Cole", {
    position: "Finance",
    email: "nina@gmail.com",
    wallets: { evm: ADDR.evmA, near: ADDR.nearB },
  }),
  member("member-14", "Omar Diaz", {
    schedule: TEAM_SCHEDULE.OnDemand,
    email: "omar@gmail.com",
  }),
  member("member-15", "Priya Shah", {
    position: "Growth",
    email: "priya@gmail.com",
    wallets: { evm: ADDR.evmB },
  }),
  member("member-16", "Quinn Blake", {
    position: "Operations",
    wallets: { near: ADDR.nearB },
  }),
  member("member-17", "Rita Gomez", {
    position: "QA",
    schedule: TEAM_SCHEDULE.OneOff,
    email: "rita@gmail.com",
    wallets: { solana: ADDR.sol },
  }),
  member("member-18", "Sam Wu", {
    email: "sam@gmail.com",
    wallets: { evm: ADDR.evmC },
  }),
  member("member-19", "Tess Nguyen", {
    position: "BD",
    email: "tess@gmail.com",
    wallets: { evm: ADDR.evmA, solana: ADDR.sol, near: ADDR.nearA },
  }),
  member("member-20", "Uma Patel", {
    position: "Contractors",
    schedule: TEAM_SCHEDULE.OnDemand,
    email: "uma@gmail.com",
  }),
  member("member-21", "Victor Lang", {
    position: "Engineer",
    email: "victor@gmail.com",
    wallets: { evm: ADDR.evmB },
  }),
  member("member-22", "Wendy Cho", {
    position: "Community Leader",
    email: "wendy@gmail.com",
    wallets: { near: ADDR.nearA },
  }),
  member("member-23", "Xavier Young", {
    schedule: TEAM_SCHEDULE.OneOff,
    email: "xavier@gmail.com",
    wallets: { solana: ADDR.sol },
  }),
  member("member-24", "Yara Klein", {
    position: "Product",
    email: "yara@gmail.com",
    wallets: { evm: ADDR.evmC },
  }),
  member("member-25", "Zane Brooks", {
    position: "Finance",
    email: "zane@gmail.com",
    wallets: { evm: ADDR.evmA },
  }),
];

let members: TeamMember[] = INITIAL_MEMBERS.map(cloneMember);
let nextId = INITIAL_MEMBERS.length + 1;

function cloneWallets(wallets: TeamMemberWallets): TeamMemberWallets {
  return { evm: wallets.evm, solana: wallets.solana, near: wallets.near, tron: wallets.tron };
}

function cloneMember(row: TeamMember): TeamMember {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    schedule: row.schedule,
    email: row.email,
    telegram: row.telegram,
    slack: row.slack,
    wallets: cloneWallets(row.wallets),
  };
}

function normalizeWrite(input: TeamMemberWrite): TeamMemberWrite {
  return {
    name: input.name.trim(),
    position: input.position.trim(),
    email: input.email.trim(),
    telegram: input.telegram.trim(),
    slack: input.slack.trim(),
    wallets: {
      evm: input.wallets.evm.trim(),
      solana: input.wallets.solana.trim(),
      near: input.wallets.near.trim(),
      tron: input.wallets.tron.trim(),
    },
  };
}

export function listTeamMembers(): TeamMember[] {
  return members.map(cloneMember);
}

export function createTeamMember(input: TeamMemberWrite): TeamMember {
  const body = normalizeWrite(input);
  const row: TeamMember = {
    id: `member-${nextId}`,
    schedule: "",
    ...body,
  };
  nextId += 1;
  members = [row, ...members];
  return cloneMember(row);
}

export function updateTeamMember(id: string, input: TeamMemberWrite): TeamMember {
  const index = members.findIndex((row) => row.id === id);
  if (index < 0) throw new Error("Member not found");
  const body = normalizeWrite(input);
  const row: TeamMember = {
    ...members[index],
    ...body,
  };
  members = members.map((current, i) => (i === index ? row : current));
  return cloneMember(row);
}

export function removeTeamMember(id: string): void {
  const next = members.filter((row) => row.id !== id);
  if (next.length === members.length) throw new Error("Member not found");
  members = next;
}

export async function sendTeamInvite(_input: TeamInviteWrite): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 400);
  });
}
