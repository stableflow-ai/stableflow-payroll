import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Icon2Right } from "@/components/icons/to-right";
import { IconExportLink } from "@/components/icons/link";
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
import { FIXED_CHAINS } from "@/config/chains";
import { usePartner } from "@/hooks/use-partner";
import { usePartnerReports } from "@/hooks/use-partner-reports";
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
  chainBlockchain,
  eachDateKey,
  isInDateRange,
  lastNDaysRange,
  matchesAmountFilter,
} from "./utils";

const NETWORK_OPTIONS = [
  { value: REPORT_FILTER_ALL, label: "All" },
  ...FIXED_CHAINS.map((chain) => ({ value: chain.blockchain, label: chain.chainName })),
];

const TOKEN_OPTIONS = [
  { value: REPORT_FILTER_ALL, label: "All" },
  ...REPORT_TOKENS.map((symbol) => ({ value: symbol, label: symbol })),
];

export function ReportsView() {
  const toast = useToast();
  const { apiKeys } = usePartner();
  const { keys, rows } = usePartnerReports();
  const [range, setRange] = useState(() => lastNDaysRange(REPORT_TIME_PRESET.Days30));
  const [apiKey, setApiKey] = useState(REPORT_FILTER_ALL);
  const [network, setNetwork] = useState(REPORT_FILTER_ALL);
  const [sourceNetwork, setSourceNetwork] = useState(REPORT_FILTER_ALL);
  const [sourceToken, setSourceToken] = useState(REPORT_FILTER_ALL);
  const [destNetwork, setDestNetwork] = useState(REPORT_FILTER_ALL);
  const [destToken, setDestToken] = useState(REPORT_FILTER_ALL);
  const [amountFilter, setAmountFilter] = useState<string>(REPORT_AMOUNT_FILTER.All);
  const [page, setPage] = useState(1);

  const apiKeyOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const key of keys) seen.set(key.id, key.label);
    for (const key of apiKeys) seen.set(key.id, key.label);
    return [
      { value: REPORT_FILTER_ALL, label: "All" },
      ...[...seen.entries()].map(([value, label]) => ({ value, label })),
    ];
  }, [apiKeys, keys]);

  const scopedRows = useMemo(() => {
    return rows.filter((row) => {
      if (!isInDateRange(row.time, range)) return false;
      if (apiKey !== REPORT_FILTER_ALL && row.apiKeyId !== apiKey) return false;
      if (network !== REPORT_FILTER_ALL) {
        const source = chainBlockchain(row.source.network);
        const dest = chainBlockchain(row.dest.network);
        if (source !== network && dest !== network) return false;
      }
      return true;
    });
  }, [apiKey, network, range, rows]);

  const summary = useMemo(() => {
    const tokenTotals = new Map<string, number>();
    let totalVolume = 0;
    for (const row of scopedRows) {
      totalVolume += row.amount;
      tokenTotals.set(row.source.symbol, (tokenTotals.get(row.source.symbol) ?? 0) + row.amount);
    }
    return {
      totalVolume,
      transactions: scopedRows.length,
      tokens: REPORT_TOKENS.map((symbol) => ({
        symbol,
        amount: tokenTotals.get(symbol) ?? 0,
      })).filter((token) => token.amount > 0),
    };
  }, [scopedRows]);

  const volumePoints = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const row of scopedRows) {
      const key = format(new Date(row.time), "yyyy-MM-dd");
      byDay.set(key, (byDay.get(key) ?? 0) + row.amount);
    }
    return eachDateKey(range).map((key) => ({
      label: key,
      value: byDay.get(key) ?? 0,
    }));
  }, [range, scopedRows]);

  const txPoints = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const row of scopedRows) {
      const key = format(new Date(row.time), "yyyy-MM-dd");
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    return eachDateKey(range).map((key) => ({
      label: key,
      value: byDay.get(key) ?? 0,
    }));
  }, [range, scopedRows]);

  const tableRows = useMemo(() => {
    return scopedRows.filter((row) => {
      if (sourceNetwork !== REPORT_FILTER_ALL && chainBlockchain(row.source.network) !== sourceNetwork) {
        return false;
      }
      if (sourceToken !== REPORT_FILTER_ALL && row.source.symbol !== sourceToken) return false;
      if (destNetwork !== REPORT_FILTER_ALL && chainBlockchain(row.dest.network) !== destNetwork) {
        return false;
      }
      if (destToken !== REPORT_FILTER_ALL && row.dest.symbol !== destToken) return false;
      if (!matchesAmountFilter(row.amount, amountFilter)) return false;
      return true;
    });
  }, [amountFilter, destNetwork, destToken, scopedRows, sourceNetwork, sourceToken]);

  const totalPage = Math.max(1, Math.ceil(tableRows.length / REPORT_PAGE_SIZE));
  const safePage = Math.min(page, totalPage);
  const pageRows = tableRows.slice((safePage - 1) * REPORT_PAGE_SIZE, safePage * REPORT_PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-montserrat text-[26px] font-semibold text-black">Reports</h1>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            value={range}
            onChange={(next) => {
              setRange(next);
              resetPage();
            }}
            className="w-full min-w-0 sm:w-auto sm:min-w-[179px]"
          />
          <Dropdown
            label="API Key"
            value={apiKey}
            onChange={(value) => {
              setApiKey(value);
              resetPage();
            }}
            options={apiKeyOptions}
            className="min-w-[min(100%,160px)] flex-1 lg:flex-none"
            triggerClassName="w-full lg:w-[139px]"
          />
          <Dropdown
            label="Networks"
            value={network}
            onChange={(value) => {
              setNetwork(value);
              resetPage();
            }}
            options={NETWORK_OPTIONS}
            className="min-w-[min(100%,160px)] flex-1 lg:flex-none"
            triggerClassName="w-full lg:w-[203px]"
          />
        </div>
        <Button
          variant={BUTTON_VARIANT.Normal}
          size={BUTTON_SIZE.Sm}
          className="h-9 w-full rounded-[6px] border-[#e3e3e3] px-3 text-black lg:w-[141px]"
          onClick={() => {
            toast.info({ title: "Export CSV is coming soon" });
          }}
        >
          Export CSV
          <IconExportLink className="size-3.5 shrink-0" />
        </Button>
      </div>

      <Card className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Total Volume
          </h2>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <p className="font-montserrat text-[26px] font-medium text-black">
              {formatAmount(summary.totalVolume, { padDecimals: true })}
            </p>
            <div className="flex flex-wrap gap-2">
              {summary.tokens.map((token) => (
                <span
                  key={token.symbol}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[18px] border border-[#e3e3e3] bg-white px-2"
                >
                  <img
                    src={tokenLogoUrl(token.symbol)}
                    alt=""
                    className="size-5 rounded-[12px] object-cover"
                  />
                  <span className="font-montserrat text-base font-medium text-black">
                    {formatAmount(token.amount, { prefix: "", padDecimals: true })}
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
            {summary.transactions}
          </p>
        </section>
      </Card>

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
            <h2 className="mb-4 font-montserrat text-base font-medium text-black">Transactions</h2>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Dropdown
                label="Source Network"
                value={sourceNetwork}
                onChange={(value) => {
                  setSourceNetwork(value);
                  resetPage();
                }}
                options={NETWORK_OPTIONS}
                className="min-w-[min(100%,220px)] flex-1"
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
                className="min-w-[min(100%,180px)] flex-1"
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
                className="min-w-[min(100%,220px)] flex-1"
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
                className="min-w-[min(100%,180px)] flex-1"
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
                className="min-w-[min(100%,180px)] flex-1"
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
        {pageRows.length === 0 ? (
          <p className="pt-20 text-center font-montserrat text-sm font-medium text-[#aaa] lg:py-[150px]">
            No transactions
          </p>
        ) : (
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatAmount(row.amount, { prefix: "" })}</TableCell>
                <TableCell>
                  <ReportsAssetCell asset={row.source} />
                </TableCell>
                <TableCell>
                  <Icon2Right className="h-2 w-3 shrink-0 text-black" />
                </TableCell>
                <TableCell>{formatAmount(row.received, { prefix: "" })}</TableCell>
                <TableCell>
                  <ReportsAssetCell asset={row.dest} />
                </TableCell>
                <TableCell>
                  <ReportsAddressCell address={row.from} href={row.fromUrl} />
                </TableCell>
                <TableCell>
                  <ReportsAddressCell address={row.to} href={row.toUrl} />
                </TableCell>
                <TableCell>{formatDate(row.time)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
    </div>
  );
}
