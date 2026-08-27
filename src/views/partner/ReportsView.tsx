import { useEffect, useMemo, useState } from "react";
import { Icon2Right } from "@/components/icons/to-right";
import { IconExportLink } from "@/components/icons/link";
import { rangeToUnixSeconds } from "@/components/date-range-picker/utils";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { Pagination } from "@/components/ui/pagination/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { FIXED_CHAINS, txExplorerUrl } from "@/config/chains";
import { usePartnerKeysQuery } from "@/hooks/use-partner-api";
import {
  usePartnerAnalyticsQuery,
  usePartnerPaymentsQuery,
} from "@/hooks/use-partner-reports";
import useToast from "@/hooks/use-toast";
import { tokenLogoUrl } from "@/lib/logo";
import { formatAmount, formatDate } from "@/utils";
import { DateRangePicker } from "@/components/date-range-picker/DateRangePicker";
import { ReportsAddressCell } from "./components/ReportsAddressCell";
import { ReportsAssetCell } from "./components/ReportsAssetCell";
import { ReportsLineChart } from "./components/ReportsLineChart";
import {
  REPORT_AMOUNT_FILTER,
  REPORT_AMOUNT_OPTIONS,
  REPORT_FILTER_ALL,
  REPORT_PAGE_SIZE,
  REPORT_TABLE_COLUMNS,
  REPORT_TIME_PRESET,
  REPORT_TOKENS,
  REPORT_TX_CHART_COLOR,
  REPORT_VOLUME_CHART_COLOR,
} from "./config";
import {
  eachDateKey,
  lastNDaysRange,
  partnerApiError,
  reportAmountQuery,
  reportDailyDateKey,
  reportOptionalApiKeyId,
  reportOptionalFilter,
} from "./utils";

const NETWORK_OPTIONS = [
  { value: REPORT_FILTER_ALL, label: "All" },
  ...FIXED_CHAINS.map((chain) => ({ value: chain.blockchain, label: chain.chainName })),
];

const TOKEN_OPTIONS = [
  { value: REPORT_FILTER_ALL, label: "All" },
  ...REPORT_TOKENS.map((symbol) => ({ value: symbol, label: symbol })),
];

function chartNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ReportsView() {
  const toast = useToast();
  const keysQuery = usePartnerKeysQuery();
  const [range, setRange] = useState(() => lastNDaysRange(REPORT_TIME_PRESET.Days30));
  const [apiKey, setApiKey] = useState(REPORT_FILTER_ALL);
  const [network, setNetwork] = useState(REPORT_FILTER_ALL);
  const [tableApiKey, setTableApiKey] = useState(REPORT_FILTER_ALL);
  const [sourceNetwork, setSourceNetwork] = useState(REPORT_FILTER_ALL);
  const [sourceToken, setSourceToken] = useState(REPORT_FILTER_ALL);
  const [destNetwork, setDestNetwork] = useState(REPORT_FILTER_ALL);
  const [destToken, setDestToken] = useState(REPORT_FILTER_ALL);
  const [amountFilter, setAmountFilter] = useState<string>(REPORT_AMOUNT_FILTER.All);
  const [page, setPage] = useState(1);

  const apiKeyOptions = useMemo(() => {
    return [
      { value: REPORT_FILTER_ALL, label: "All" },
      ...(keysQuery.data ?? []).map((key) => ({ value: String(key.id), label: key.label })),
    ];
  }, [keysQuery.data]);

  const times = rangeToUnixSeconds(range);
  const analyticsQuery = usePartnerAnalyticsQuery({
    start_time: times.start_time,
    end_time: times.end_time,
    api_key_id: reportOptionalApiKeyId(apiKey),
    network: reportOptionalFilter(network),
  });
  const paymentsQuery = usePartnerPaymentsQuery({
    page,
    pageSize: REPORT_PAGE_SIZE,
    api_key_id: reportOptionalApiKeyId(tableApiKey),
    network: reportOptionalFilter(sourceNetwork),
    token: reportOptionalFilter(sourceToken),
    destination_network: reportOptionalFilter(destNetwork),
    destination_token: reportOptionalFilter(destToken),
    ...reportAmountQuery(amountFilter),
  });

  const dailyByDate = useMemo(() => {
    const map = new Map<string, { volume: number; count: number }>();
    for (const item of analyticsQuery.data?.dailyStats ?? []) {
      map.set(reportDailyDateKey(item.date), {
        volume: chartNumber(item.totalAmount),
        count: item.transactionCount,
      });
    }
    return map;
  }, [analyticsQuery.data?.dailyStats]);

  const volumePoints = useMemo(() => {
    return eachDateKey(range).map((key) => ({
      label: key,
      value: dailyByDate.get(key)?.volume ?? 0,
    }));
  }, [dailyByDate, range]);

  const txPoints = useMemo(() => {
    return eachDateKey(range).map((key) => ({
      label: key,
      value: dailyByDate.get(key)?.count ?? 0,
    }));
  }, [dailyByDate, range]);

  const tokenChips = (analyticsQuery.data?.tokenStats ?? []).filter(
    (item) => chartNumber(item.totalAmount) > 0,
  );
  const transactionCount = (analyticsQuery.data?.dailyStats ?? []).reduce(
    (sum, item) => sum + item.transactionCount,
    0,
  );

  const totalPage = Math.max(1, paymentsQuery.data?.totalPage ?? 1);
  const safePage = Math.min(page, totalPage);
  const pageRows = paymentsQuery.data?.list ?? [];

  useEffect(() => {
    if (page > totalPage) setPage(totalPage);
  }, [page, totalPage]);
  const analyticsError = analyticsQuery.isError
    ? partnerApiError(analyticsQuery.error, "Failed to load report stats")
    : null;
  const paymentsError = paymentsQuery.isError
    ? partnerApiError(paymentsQuery.error, "Failed to load transactions")
    : null;

  const resetPage = () => setPage(1);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-montserrat text-[26px] font-semibold text-black">Reports</h1>

      <div className="mx-auto flex w-full max-w-[1212px] flex-col gap-5">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <DateRangePicker
            value={range}
            onChange={setRange}
            className="w-full min-w-0 sm:w-auto sm:min-w-[179px]"
          />
          <Dropdown
            label="API Key"
            value={apiKey}
            onChange={setApiKey}
            options={apiKeyOptions}
            className="min-w-[min(100%,160px)] flex-1 lg:flex-none"
            triggerClassName="w-full"
          />
          <Dropdown
            label="Networks"
            value={network}
            onChange={setNetwork}
            options={NETWORK_OPTIONS}
            className="min-w-[min(100%,160px)] flex-1 lg:flex-none"
            triggerClassName="w-full"
          />
        </div>

        <Card className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <section>
            <h2 className="font-montserrat text-base font-medium capitalize text-black">
              Total Volume
            </h2>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <p className="font-montserrat text-[26px] font-medium text-black">
                {analyticsQuery.isPending
                  ? "—"
                  : formatAmount(analyticsQuery.data?.totalVolume || "0", { padDecimals: true })}
              </p>
              <div className="flex flex-wrap gap-2">
                {tokenChips.map((token) => (
                  <span
                    key={token.token}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[18px] border border-[#e3e3e3] bg-white px-2"
                  >
                    <img
                      src={tokenLogoUrl(token.token)}
                      alt=""
                      className="size-5 rounded-[12px] object-cover"
                    />
                    <span className="font-montserrat text-base font-medium text-black">
                      {formatAmount(token.totalAmount, { prefix: "", padDecimals: true })}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </section>
          <section>
            <h2 className="font-montserrat text-base font-medium capitalize text-black">
              Transactions
            </h2>
            <p className="mt-2 font-montserrat text-[26px] font-medium text-black">
              {analyticsQuery.isPending ? "—" : transactionCount}
            </p>
          </section>
        </Card>
        {analyticsError ? (
          <p className="font-montserrat text-sm text-danger">{analyticsError}</p>
        ) : null}

        <ReportsLineChart
          title="Volume by Days"
          points={volumePoints}
          color={REPORT_VOLUME_CHART_COLOR}
          currency
        />
        <ReportsLineChart
          title="Transactions by Days"
          points={txPoints}
          color={REPORT_TX_CHART_COLOR}
        />

        <Table
          columns={REPORT_TABLE_COLUMNS}
          toolbar={
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-montserrat text-base font-medium text-black">Transactions</h2>
                <Button
                  variant={BUTTON_VARIANT.Normal}
                  size={BUTTON_SIZE.Sm}
                  className="h-9 w-full rounded-[6px] border-[#e3e3e3] px-3 text-black sm:w-auto"
                  onClick={() => {
                    toast.info({ title: "Export CSV is coming soon" });
                  }}
                >
                  Export CSV
                  <IconExportLink className="size-3.5 shrink-0" />
                </Button>
              </div>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Dropdown
                  label="API Key"
                  value={tableApiKey}
                  onChange={(value) => {
                    setTableApiKey(value);
                    resetPage();
                  }}
                  options={apiKeyOptions}
                  className="min-w-0 w-full"
                  triggerClassName="w-full"
                />
                <Dropdown
                  label="Source Network"
                  value={sourceNetwork}
                  onChange={(value) => {
                    setSourceNetwork(value);
                    resetPage();
                  }}
                  options={NETWORK_OPTIONS}
                  className="min-w-0 w-full"
                  triggerClassName="w-full"
                />
                <Dropdown
                  label="Source Token"
                  value={sourceToken}
                  onChange={(value) => {
                    setSourceToken(value);
                    resetPage();
                  }}
                  options={TOKEN_OPTIONS}
                  className="min-w-0 w-full"
                  triggerClassName="w-full"
                />
                <Dropdown
                  label="Destination Network"
                  value={destNetwork}
                  onChange={(value) => {
                    setDestNetwork(value);
                    resetPage();
                  }}
                  options={NETWORK_OPTIONS}
                  className="min-w-0 w-full"
                  triggerClassName="w-full"
                />
                <Dropdown
                  label="Destination Token"
                  value={destToken}
                  onChange={(value) => {
                    setDestToken(value);
                    resetPage();
                  }}
                  options={TOKEN_OPTIONS}
                  className="min-w-0 w-full"
                  triggerClassName="w-full"
                />
                <Dropdown
                  label="Amount"
                  value={amountFilter}
                  onChange={(value) => {
                    setAmountFilter(value);
                    resetPage();
                  }}
                  options={[...REPORT_AMOUNT_OPTIONS]}
                  className="min-w-0 w-full"
                  triggerClassName="w-full"
                />
              </div>
            </>
          }
          footer={
            <div className="mt-4 flex justify-center sm:justify-end">
              <Pagination page={safePage} totalPage={totalPage} onPageChange={setPage} />
            </div>
          }
        >
          <TableHeader>
            <TableHead>Amount</TableHead>
            <TableHead>Source</TableHead>
            <TableHead />
            <TableHead>Received</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Time</TableHead>
          </TableHeader>
          {paymentsQuery.isPending && pageRows.length === 0 ? (
            <p className="pt-20 text-center font-montserrat text-sm font-medium text-[#aaa] lg:py-[150px]">
              Loading transactions…
            </p>
          ) : paymentsError && pageRows.length === 0 ? (
            <p className="pt-20 text-center font-montserrat text-sm font-medium text-danger lg:py-[150px]">
              {paymentsError}
            </p>
          ) : pageRows.length === 0 ? (
            <p className="pt-20 text-center font-montserrat text-sm font-medium text-[#aaa] lg:py-[150px]">
              No transactions
            </p>
          ) : (
            <TableBody>
              {pageRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatAmount(row.amount, { prefix: "", showDust: true })}</TableCell>
                  <TableCell>
                    <ReportsAssetCell asset={{ symbol: row.token, network: row.network }} />
                  </TableCell>
                  <TableCell>
                    <Icon2Right className="h-2 w-3 shrink-0 text-black" />
                  </TableCell>
                  <TableCell>{formatAmount(row.destinationAmount, { prefix: "", showDust: true })}</TableCell>
                  <TableCell>
                    <ReportsAssetCell
                      asset={{ symbol: row.destinationToken, network: row.destinationNetwork }}
                    />
                  </TableCell>
                  <TableCell>
                    {row.payer.trim() ? (
                      <ReportsAddressCell
                        address={row.payer}
                        href={txExplorerUrl(row.network, row.txHash)}
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {row.recipient.trim() ? (
                      <ReportsAddressCell
                        address={row.recipient}
                        href={txExplorerUrl(row.destinationNetwork, row.destinationTxHash)}
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{formatDate(row.submittedAt) || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>
    </div>
  );
}
