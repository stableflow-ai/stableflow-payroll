import { Keypair } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import * as squads from "@sqds/multisig";
import { memberProposalAccess } from "./access";

describe("memberProposalAccess", () => {
  const member = Keypair.generate().publicKey;

  it("returns ok when the member can initiate", () => {
    expect(memberProposalAccess(
      [{ key: member, permissions: squads.types.Permissions.fromPermissions([squads.types.Permission.Initiate]) }],
      member.toBase58(),
    )).toBe("ok");
  });

  it("returns not-member when the wallet is missing", () => {
    expect(memberProposalAccess([], member.toBase58())).toBe("not-member");
  });

  it("returns no-initiate when the member cannot propose", () => {
    expect(memberProposalAccess(
      [{ key: member, permissions: squads.types.Permissions.fromPermissions([squads.types.Permission.Vote]) }],
      member.toBase58(),
    )).toBe("no-initiate");
  });
});
