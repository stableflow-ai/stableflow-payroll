import { describe, expect, it } from "vitest";
import { mapTeamMember, mapTeamMembersPage, teamMemberWriteBody } from "./team";

describe("mapTeamMember", () => {
  it("maps flattened wallet fields", () => {
    expect(
      mapTeamMember({
        id: 3,
        name: "Andrew",
        position: "BD",
        email: "andrew@gmail.com",
        evm_address: "0xabc",
        solana_address: "sol",
        near_address: "alice.near",
        tron_address: "Ttron",
      }),
    ).toEqual({
      id: 3,
      name: "Andrew",
      position: "BD",
      email: "andrew@gmail.com",
      wallets: { evm: "0xabc", solana: "sol", near: "alice.near", tron: "Ttron" },
    });
  });

  it("drops rows without an id or name", () => {
    expect(mapTeamMember({ name: "Andrew" })).toBeNull();
    expect(mapTeamMember({ id: 1, name: "  " })).toBeNull();
  });
});

describe("mapTeamMembersPage", () => {
  it("maps list and totals", () => {
    expect(
      mapTeamMembersPage({
        list: [{ id: 1, name: "Ada" }, { id: 2, name: "  " }],
        total: 12,
        total_page: 2,
      }),
    ).toEqual({
      list: [
        {
          id: 1,
          name: "Ada",
          position: "",
          email: "",
          wallets: { evm: "", solana: "", near: "", tron: "" },
        },
      ],
      total: 12,
      totalPage: 2,
    });
  });
});

describe("teamMemberWriteBody", () => {
  it("omits empty optional fields", () => {
    expect(
      teamMemberWriteBody({
        name: " Ada ",
        position: "",
        email: "  ",
        wallets: { evm: "0xabc", solana: "", near: "", tron: "" },
      }),
    ).toEqual({ name: "Ada", evm_address: "0xabc" });
  });
});
