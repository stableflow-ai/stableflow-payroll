import { describe, expect, it } from "vitest";
import {
  bonusImportRequestBody,
  mapBonusCurrentStats,
  mapBonusHistoryItem,
  mapBonusHistoryResp,
  mapBonusImportResp,
  mapBonusOpenItem,
  mapBonusOpenList,
  mapBonusRecentPayout,
  mapBonusTotalPayoutPoint,
} from "./bonus";

describe("mapBonusCurrentStats", () => {
  it("maps totals and member counts", () => {
    expect(
      mapBonusCurrentStats({
        total_bonus: "600",
        total_bonus_change: "+10%",
        members: 9,
        members_change: "20",
      }),
    ).toEqual({
      totalBonus: "600",
      totalChangePercent: 10,
      members: 9,
      membersChangePercent: 20,
    });
  });

  it("treats missing change as null", () => {
    expect(mapBonusCurrentStats({}).totalChangePercent).toBeNull();
  });
});

describe("mapBonusTotalPayoutPoint", () => {
  it("maps time and volume", () => {
    expect(mapBonusTotalPayoutPoint({ time: "2026-08-01", volume: "600" })).toEqual({
      time: "2026-08-01",
      volume: "600",
    });
  });
});

describe("mapBonusRecentPayout", () => {
  it("maps destination fields and completed status to paid", () => {
    expect(
      mapBonusRecentPayout({
        id: 9,
        destination_amount: "200",
        destination_symbol: "USDC",
        destination_network: "near",
        recipient: "0xabc",
        status: "completed",
      }),
    ).toEqual({
      id: "9",
      amount: "200",
      token: "USDC",
      network: "near",
      recipient: "0xabc",
      status: "paid",
    });
  });
});

describe("mapBonusOpenItem", () => {
  it("maps a batch and paying status from any member", () => {
    expect(
      mapBonusOpenItem({
        batch_id: 4,
        title: "Project Bonus - Team A",
        volume: "800",
        list: [
          {
            id: 1,
            name: "Alice",
            address: "0x253",
            email: "alice@example.com",
            amount: "200",
            symbol: "USDC",
            status: "open",
          },
          {
            id: 2,
            name: "Bill",
            address: "0x254",
            amount: "200",
            symbol: "USDC",
            status: "processing",
          },
        ],
      }),
    ).toEqual({
      id: "4",
      batchId: 4,
      title: "Project Bonus - Team A",
      amount: "800",
      token: "USDC",
      action: "paying",
      members: [
        {
          id: "4-1",
          name: "Alice",
          address: "0x253",
          email: "alice@example.com",
          amount: "200",
          token: "USDC",
        },
        {
          id: "4-2",
          name: "Bill",
          address: "0x254",
          email: "",
          amount: "200",
          token: "USDC",
        },
      ],
    });
  });

  it("drops a batch with no members", () => {
    expect(mapBonusOpenItem({ batch_id: 1, title: "Empty", list: [] })).toBeNull();
  });
});

describe("mapBonusOpenList", () => {
  it("keeps batches grouped and reads totals", () => {
    expect(
      mapBonusOpenList({
        total_payout: "1400",
        total_count: 5,
        batches: [
          {
            batch_id: 1,
            title: "Andrew",
            volume: "200",
            list: [{ id: 1, name: "Andrew", amount: "200", symbol: "USDC" }],
          },
          {
            batch_id: 2,
            title: "Team A",
            volume: "1200",
            list: [
              { id: 2, name: "Alice", amount: "200", symbol: "USDC" },
              { id: 3, name: "Bill", amount: "200", symbol: "USDC" },
            ],
          },
        ],
      }),
    ).toMatchObject({
      totalAmount: "1400",
      token: "USDC",
      entryCount: 5,
      items: [
        { id: "1", batchId: 1, title: "Andrew", action: "pay_now" },
        { id: "2", batchId: 2, title: "Team A" },
      ],
    });
  });
});

describe("mapBonusHistoryItem", () => {
  it("maps volume and paid time", () => {
    expect(
      mapBonusHistoryItem({
        id: 4,
        name: "Andrew",
        destination_volume: "200",
        paid_at: "2026-08-01T00:00:00Z",
      }),
    ).toEqual({
      id: "4",
      title: "Andrew",
      totalPayout: "200",
      memberCount: 1,
      executedAt: "2026-08-01T00:00:00Z",
      recipient: "",
    });
  });

  it("falls back to purpose and created_at", () => {
    expect(
      mapBonusHistoryItem({
        id: 5,
        purpose: "Q3 Bonus",
        amount: "540",
        created_at: "2026-07-01T00:00:00Z",
      }),
    ).toMatchObject({
      title: "Q3 Bonus",
      totalPayout: "540",
      executedAt: "2026-07-01T00:00:00Z",
    });
  });
});

describe("mapBonusHistoryResp", () => {
  it("maps paginated history", () => {
    expect(
      mapBonusHistoryResp({
        total: 2,
        total_page: 1,
        list: [{ id: 1, name: "Andrew" }, { id: 2, name: "Hannah" }],
      }),
    ).toMatchObject({
      total: 2,
      totalPage: 1,
      list: [{ id: "1", title: "Andrew" }, { id: "2", title: "Hannah" }],
    });
  });
});

describe("mapBonusImportResp", () => {
  it("maps batch id and count", () => {
    expect(mapBonusImportResp({ batch_id: 12, count: 3 })).toEqual({
      batchId: 12,
      count: 3,
    });
  });
});

describe("bonusImportRequestBody", () => {
  it("sends swagger fields and omits empty optionals", () => {
    expect(
      bonusImportRequestBody({
        organizationId: 7,
        title: "  September bonus  ",
        items: [
          {
            name: "Andrew",
            address: "0x253",
            amount: "200",
            network: "near",
            symbol: "USDC",
            email: "",
            description: "  ",
            purpose: "Q3",
          },
        ],
      }),
    ).toEqual({
      organization_id: 7,
      title: "September bonus",
      items: [
        {
          name: "Andrew",
          address: "0x253",
          amount: "200",
          network: "near",
          symbol: "USDC",
          purpose: "Q3",
        },
      ],
    });
  });

  it("truncates title and item fields to swagger max lengths", () => {
    const body = bonusImportRequestBody({
      organizationId: 1,
      title: "T".repeat(120),
      items: [
        {
          name: "N".repeat(60),
          address: "A".repeat(140),
          amount: "1",
          network: "eth-network-name-is-too-long-for-the-api",
          symbol: "S".repeat(40),
          email: "e".repeat(120),
          purpose: "P".repeat(140),
          description: "D".repeat(5001),
        },
      ],
    });
    expect(body.title).toHaveLength(100);
    expect(body.items[0]?.name).toHaveLength(50);
    expect(body.items[0]?.address).toHaveLength(128);
    expect(body.items[0]?.network).toHaveLength(32);
    expect(body.items[0]?.symbol).toHaveLength(32);
    expect(body.items[0]?.email).toHaveLength(100);
    expect(body.items[0]?.purpose).toHaveLength(100);
    expect(body.items[0]?.description).toHaveLength(5000);
  });
});
