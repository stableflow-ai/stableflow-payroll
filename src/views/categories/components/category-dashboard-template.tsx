import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { IconCopy } from "@/components/icons/copy";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { Card } from "@/components/ui/card/Card";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { cn } from "@/lib/utils";
import {
  CATEGORY_DASHBOARD_CHART_LINE_COLOR,
  CATEGORY_DASHBOARD_CHART_POINTS,
  CATEGORY_DASHBOARD_CHART_Y_TICKS,
  CATEGORY_DASHBOARD_GROUPED_COLUMNS,
  CATEGORY_DASHBOARD_TAB,
  type CategoryDashboardGroupedPayment,
  type CategoryDashboardSamplePayment,
  type CategoryDashboardTab,
} from "../config";

export function CategoryDashboardTemplate(props: {
  samplePayment?: CategoryDashboardSamplePayment;
  groupedPayment?: CategoryDashboardGroupedPayment;
  chartHighlightLabel?: string;
  onBack?: () => void;
  onAdd?: () => void;
}) {
  const { samplePayment, groupedPayment, chartHighlightLabel, onBack, onAdd } = props;
  const [tab, setTab] = useState<CategoryDashboardTab>(CATEGORY_DASHBOARD_TAB.Payments);

  return (
    <div className="flex min-h-full flex-col gap-4">
      <StatsRow />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,298px)]">
        <TotalPaymentChart highlightLabel={chartHighlightLabel} />
        <RecentPayouts />
      </div>
      <div className="mt-4">
        <div className="flex items-end gap-8">
          <TabButton
            active={tab === CATEGORY_DASHBOARD_TAB.Payments}
            onClick={() => setTab(CATEGORY_DASHBOARD_TAB.Payments)}
          >
            Payments
          </TabButton>
          <TabButton
            active={tab === CATEGORY_DASHBOARD_TAB.PayoutHistory}
            onClick={() => setTab(CATEGORY_DASHBOARD_TAB.PayoutHistory)}
          >
            Payout History
          </TabButton>
        </div>
        {tab === CATEGORY_DASHBOARD_TAB.Payments ? (
          groupedPayment ? (
            <GroupedPaymentsTable group={groupedPayment} />
          ) : samplePayment ? (
            <PaymentsTable row={samplePayment} />
          ) : null
        ) : (
          <PayoutHistoryEmpty />
        )}
      </div>
      {onAdd ? (
        <div className="mt-auto flex justify-end gap-4 pt-8">
          {onBack ? (
            <Button
              variant={BUTTON_VARIANT.Normal}
              className="h-[50px] w-[182px] rounded-[12px] border-[#e3e3e3] text-base text-black shadow-none md:h-[50px] md:text-base"
              onClick={onBack}
            >
              Back
            </Button>
          ) : null}
          <Button
            className="h-[50px] w-[182px] rounded-[12px] text-base shadow-none md:h-[50px] md:text-base"
            onClick={onAdd}
          >
            Add Category
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StatsRow() {
  return (
    <Card className="grid grid-cols-1 gap-8 px-10 py-[22px] sm:grid-cols-2">
      <StatColumn label="Total Payment" value="$0" />
      <StatColumn label="Number of payments" value="0" />
    </Card>
  );
}

function StatColumn(props: { label: string; value: string }) {
  const { label, value } = props;
  return (
    <div className="min-w-0">
      <p className="font-montserrat text-sm font-medium text-[#606060]">{label}</p>
      <p className="mt-1.5 font-montserrat text-[20px] font-semibold text-black">{value}</p>
      <p className="mt-1.5 font-montserrat text-xs leading-none">
        <span className="font-medium text-[#aaa]">-%</span>{" "}
        <span className="font-normal text-[#aaa]">from last month</span>
      </p>
    </div>
  );
}

function TotalPaymentChart(props: { highlightLabel?: string }) {
  const { highlightLabel } = props;
  const yMax = CATEGORY_DASHBOARD_CHART_Y_TICKS[CATEGORY_DASHBOARD_CHART_Y_TICKS.length - 1];

  return (
    <Card className="flex h-[300px] flex-col">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-montserrat text-base font-medium text-black">Total Payment</h2>
        <Dropdown
          value="monthly"
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
          triggerClassName="h-6 w-[76px] rounded-[18px] border-black/10 bg-transparent px-2 text-[10px] text-[#606060]"
        />
      </div>
      <div className="mt-2 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={[...CATEGORY_DASHBOARD_CHART_POINTS]}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#e3e3e3" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={(tickProps) => {
                const { x, y, payload } = tickProps;
                const active = payload?.value === highlightLabel;
                return (
                  <text
                    x={x}
                    y={y}
                    dy={12}
                    textAnchor="middle"
                    fill={active ? "#606060" : "#aaa"}
                    fontSize={12}
                    fontFamily="Montserrat"
                  >
                    {payload?.value}
                  </text>
                );
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, yMax]}
              ticks={[...CATEGORY_DASHBOARD_CHART_Y_TICKS]}
              tickFormatter={formatYTick}
              tick={{ fill: "#aaa", fontSize: 12, fontFamily: "Montserrat" }}
              width={48}
            />
            <Line
              type="linear"
              dataKey="value"
              stroke={CATEGORY_DASHBOARD_CHART_LINE_COLOR}
              strokeWidth={1.6}
              dot={{
                r: 4,
                fill: CATEGORY_DASHBOARD_CHART_LINE_COLOR,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function RecentPayouts() {
  return (
    <Card className="flex h-[300px] flex-col">
      <h2 className="font-montserrat text-base font-medium capitalize text-black">Recent Payouts</h2>
      <div className="flex flex-1 items-center justify-center">
        <p className="font-montserrat text-sm font-normal text-[#aaa]">No recent payouts</p>
      </div>
    </Card>
  );
}

function PaymentsTable(props: { row: CategoryDashboardSamplePayment }) {
  const { row } = props;

  return (
    <Table className="relative mt-3 min-h-[294px] p-4" columns="1.6fr 1.2fr 1fr 0.7fr">
      <TableHeader className="border-b-0 bg-transparent px-3">
        <TableHead>Pay for</TableHead>
        <TableHead>Address</TableHead>
        <TableHead>Payout</TableHead>
        <TableHead className="justify-end">Amount</TableHead>
      </TableHeader>
      <TableBody>
        <TableRow className="rounded-[12px] border-b-0 bg-[#F6F6F6] px-3">
          <TableCell>{row.payFor}</TableCell>
          <TableCell>
            <MaskedAddress address={row.address} />
          </TableCell>
          <TableCell>{row.payout}</TableCell>
          <TableCell className="justify-end">{row.amount}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function GroupedPaymentsTable(props: { group: CategoryDashboardGroupedPayment }) {
  const { group } = props;
  const [expanded, setExpanded] = useState(true);

  return (
    <Table className="relative mt-3 min-h-[391px] p-4" columns={CATEGORY_DASHBOARD_GROUPED_COLUMNS}>
      <TableHeader className="border-b-0 bg-transparent px-3">
        <TableHead>Pay for</TableHead>
        <TableHead>Account</TableHead>
        <TableHead>Channel</TableHead>
        <TableHead>Address</TableHead>
        <TableHead>Payout</TableHead>
        <TableHead>Amount</TableHead>
      </TableHeader>
      <TableBody>
        <div
          className={cn(
            "min-w-min w-full overflow-hidden rounded-[12px] bg-[#f6f6f6]",
            expanded && "border border-[#d9d9d9]",
          )}
        >
          <TableRow className="min-h-14 border-0 bg-transparent px-3">
            <TableCell>{group.payFor}</TableCell>
            <TableCell>
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="inline-flex items-center gap-1.5 font-montserrat text-sm font-medium text-[#06f]"
                aria-expanded={expanded}
              >
                {group.accountCount}
                <IconArrowDown
                  className={cn(
                    "h-1 w-2.5 shrink-0 transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>
            </TableCell>
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell>{group.amount}</TableCell>
          </TableRow>
          {expanded
            ? group.children.map((child, index) => (
                <TableRow
                  key={child.account}
                  className={cn(
                    "min-h-12 border-0 bg-transparent px-3",
                    index === 0 && "border-t border-black/10",
                    index < group.children.length - 1 && "border-b border-black/10",
                  )}
                >
                  <TableCell />
                  <TableCell>
                    <span className={group.accountClassName}>{child.account}</span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex h-5 items-center rounded-[10px] bg-[#f0f0f0] px-2 font-montserrat text-xs font-medium text-[#606060]">
                      {child.channel}
                    </span>
                  </TableCell>
                  <TableCell>
                    <MaskedAddress address={child.address} iconClassName="size-4" />
                  </TableCell>
                  <TableCell>{child.payout}</TableCell>
                  <TableCell>{child.amount}</TableCell>
                </TableRow>
              ))
            : null}
        </div>
      </TableBody>
    </Table>
  );
}

function MaskedAddress(props: { address: string; iconClassName?: string }) {
  const { address, iconClassName = "size-3" } = props;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="truncate">{address}</span>
      <span className="shrink-0 text-[#909090]" aria-hidden>
        <IconCopy className={iconClassName} />
      </span>
    </span>
  );
}

function PayoutHistoryEmpty() {
  return (
    <Card className="mt-3 flex min-h-[294px] items-center justify-center">
      <p className="font-montserrat text-sm font-normal text-[#aaa]">No payout history</p>
    </Card>
  );
}

function TabButton(props: { active: boolean; onClick: () => void; children: string }) {
  const { active, onClick, children } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative cursor-pointer pb-2.5 font-montserrat text-base text-black",
        active ? "font-semibold" : "font-normal",
      )}
    >
      {children}
      {active ? <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-[#06f]" /> : null}
    </button>
  );
}

function formatYTick(value: number) {
  if (value === 0) return "$0";
  return `$${value / 1000}K`;
}
