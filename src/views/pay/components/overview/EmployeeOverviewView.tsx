import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card/Card";
import {
  useEmployeeOverviewQuery,
  type EmployeeOverview,
} from "@/hooks/use-employee-overview-api";
import { useAuthStore } from "@/stores/auth";
import { formatAmount } from "@/utils";
import type { VolumePeriod } from "@/types/payout";
import { OpenRequestsCard } from "./OpenRequestsCard";
import { PaymentVolumeCard } from "./PaymentVolumeCard";
import { RecentPaymentsTable } from "./RecentPaymentsTable";
import { DEFAULT_OVERVIEW_VOLUME_PERIOD } from "./config";
import { greetingName, volumeChartPoints } from "./utils";

function StatPair(props: {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
}) {
  const { leftLabel, leftValue, rightLabel, rightValue } = props;
  return (
    <Card className="grid grid-cols-2 gap-4">
      <section>
        <h2 className="font-montserrat text-base font-medium capitalize text-black">{leftLabel}</h2>
        <p className="mt-2 font-montserrat text-[26px] font-medium text-black">{leftValue}</p>
      </section>
      <section>
        <h2 className="font-montserrat text-base font-medium capitalize text-black">{rightLabel}</h2>
        <p className="mt-2 font-montserrat text-[26px] font-medium text-black">{rightValue}</p>
      </section>
    </Card>
  );
}

function EmployeeOverviewBody(props: { data: EmployeeOverview }) {
  const { data } = props;
  const user = useAuthStore((state) => state.user);
  const [range, setRange] = useState<VolumePeriod>(DEFAULT_OVERVIEW_VOLUME_PERIOD);
  const name = greetingName(user?.name);
  const points = useMemo(
    () => volumeChartPoints(range, data.volume[range]),
    [data.volume, range],
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="font-montserrat text-[26px] font-medium text-black">
        {name ? `Hi! ${name}` : "Hi!"}
      </p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <StatPair
          leftLabel="Total Income"
          leftValue={formatAmount(data.totalIncome)}
          rightLabel="Payment Transaction"
          rightValue={String(data.incomeTxCount)}
        />
        <StatPair
          leftLabel="Total Payout"
          leftValue={formatAmount(data.totalPayout)}
          rightLabel="Payout Transaction"
          rightValue={String(data.payoutTxCount)}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <PaymentVolumeCard range={range} onRangeChange={setRange} points={points} />
        <OpenRequestsCard requests={data.openRequests} />
      </div>
      <RecentPaymentsTable rows={data.recentPayments} />
    </div>
  );
}

export function EmployeeOverviewView() {
  const query = useEmployeeOverviewQuery();

  if (query.isPending) {
    return <p className="font-montserrat text-sm text-[#909090]">Loading…</p>;
  }

  if (query.isError) {
    return (
      <p className="font-montserrat text-sm text-danger">
        {query.error instanceof Error ? query.error.message : "Failed to load overview"}
      </p>
    );
  }

  if (!query.data) return null;

  return <EmployeeOverviewBody data={query.data} />;
}
