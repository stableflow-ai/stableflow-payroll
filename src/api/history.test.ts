import { describe, expect, it } from "vitest";
import {
  historyFilterQuery,
  historyListQuery,
  historyPath,
  mapHistoryItem,
  mapHistoryListResp,
} from "./history";
import { HISTORY_STATUS } from "@/types/history";

const FILTERS = {
  organizationId: 8,
  q: "0xabc",
  status: HISTORY_STATUS.Completed,
  sourceNetwork: "eth",
  sourceToken: "USDC",
  destNetwork: "arb",
  destToken: "USDT",
  startTime: 1_700_000_000,
  endTime: 1_700_086_400,
};

describe("historyPath", () => {
  it("picks admin vs member list and export routes", () => {
    expect(historyPath(false)).toBe("/v1/payroll/organizations/history");
    expect(historyPath(true)).toBe("/v1/payroll/history");
    expect(historyPath(false, true)).toBe("/v1/payroll/organizations/history/export");
    expect(historyPath(true, true)).toBe("/v1/payroll/history/export");
  });
});

describe("historyListQuery", () => {
  it("sends snake_case filters and pagination", () => {
    expect(
      historyListQuery({
        ...FILTERS,
        page: 2,
        pageSize: 10,
      }),
    ).toEqual({
      organization_id: 8,
      q: "0xabc",
      status: "completed",
      source_network: "eth",
      source_symbol: "USDC",
      destination_network: "arb",
      destination_symbol: "USDT",
      start_time: 1_700_000_000,
      end_time: 1_700_086_400,
      page: 2,
      pageSize: 10,
    });
  });

  it("omits empty All filters", () => {
    expect(
      historyListQuery({
        organizationId: 3,
        page: 1,
        pageSize: 10,
      }),
    ).toEqual({
      organization_id: 3,
      q: undefined,
      status: undefined,
      source_network: undefined,
      source_symbol: undefined,
      destination_network: undefined,
      destination_symbol: undefined,
      start_time: undefined,
      end_time: undefined,
      page: 1,
      pageSize: 10,
    });
  });
});

describe("historyFilterQuery", () => {
  it("drops page fields for export", () => {
    expect(historyFilterQuery(FILTERS)).toEqual({
      organization_id: 8,
      q: "0xabc",
      status: "completed",
      source_network: "eth",
      source_symbol: "USDC",
      destination_network: "arb",
      destination_symbol: "USDT",
      start_time: 1_700_000_000,
      end_time: 1_700_086_400,
    });
    expect(historyFilterQuery(FILTERS)).not.toHaveProperty("page");
    expect(historyFilterQuery(FILTERS)).not.toHaveProperty("pageSize");
  });
});

describe("mapHistoryItem", () => {
  it("maps snake_case payment fields and falls back submitted_at to created_at", () => {
    expect(
      mapHistoryItem({
        payment_id: "pay-1",
        source_amount: "11000",
        source_symbol: "USDT",
        source_network: "base",
        destination_amount: "10999.98",
        destination_symbol: "USDC",
        destination_network: "arb",
        payer: "0xfrom",
        recipient: "0xto",
        tx_hash: "0xtx",
        destination_tx_hash: "0xdtx",
        status: "Completed",
        created_at: "2026-09-01T00:00:00Z",
      }),
    ).toEqual({
      id: "pay-1",
      amount: "11000",
      token: "USDT",
      network: "base",
      destinationAmount: "10999.98",
      destinationToken: "USDC",
      destinationNetwork: "arb",
      payer: "0xfrom",
      recipient: "0xto",
      txHash: "0xtx",
      destinationTxHash: "0xdtx",
      status: "completed",
      submittedAt: "2026-09-01T00:00:00Z",
    });
  });

  it("drops rows without payment_id", () => {
    expect(mapHistoryItem({ source_amount: "1" })).toBeNull();
  });
});

describe("mapHistoryListResp", () => {
  it("maps list total and total_page", () => {
    const mapped = mapHistoryListResp({
      total: 2,
      total_page: 1,
      list: [
        { payment_id: "a", source_amount: "1" },
        { source_amount: "2" },
      ],
    });
    expect(mapped.total).toBe(2);
    expect(mapped.totalPage).toBe(1);
    expect(mapped.list.map((row) => row.id)).toEqual(["a"]);
  });
});
