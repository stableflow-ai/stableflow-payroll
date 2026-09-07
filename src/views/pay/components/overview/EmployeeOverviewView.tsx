import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card/Card";
import {
  useMemberOverviewPayoutQuery,
  useMemberOverviewQuery,
} from "@/hooks/use-employee-overview-api";
import {
  usePendingPaymentRequestsQuery,
  useRecentPaymentRequestsQuery,
} from "@/hooks/use-request-payment";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import { formatAmount } from "@/utils";
import type { VolumePeriod } from "@/types/payout";
import { OpenRequestsCard } from "./OpenRequestsCard";
import { EmployeeOverviewSkeleton } from "./OverviewSkeleton";
import { PaymentVolumeCard } from "./PaymentVolumeCard";
import { RecentPaymentsTable } from "./RecentPaymentsTable";
import {
  DEFAULT_OVERVIEW_VOLUME_PERIOD,
  OPEN_REQUESTS_LIMIT,
  RECENT_PAYMENTS_LIMIT,
} from "./config";
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

export function EmployeeOverviewView() {
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const statsQuery = useMemberOverviewQuery();
  const [range, setRange] = useState<VolumePeriod>(DEFAULT_OVERVIEW_VOLUME_PERIOD);
  const payoutQuery = useMemberOverviewPayoutQuery(range);
  const openQuery = usePendingPaymentRequestsQuery(OPEN_REQUESTS_LIMIT);
  const recentQuery = useRecentPaymentRequestsQuery(RECENT_PAYMENTS_LIMIT);
  const name = greetingName(user?.name);
  const points = useMemo(
    () => volumeChartPoints(range, payoutQuery.data),
    [payoutQuery.data, range],
  );

  if (orgId === null) {
    return (
      <p className="font-montserrat text-sm text-danger">Organization is missing</p>
    );
  }

  if (statsQuery.isPending) {
    return <EmployeeOverviewSkeleton />;
  }

  if (statsQuery.isError) {
    return (
      <p className="font-montserrat text-sm text-danger">
        {statsQuery.error instanceof Error ? statsQuery.error.message : "Failed to load overview"}
      </p>
    );
  }

  if (!statsQuery.data) return null;

  return (
    <div className="flex flex-col gap-5">
      <p className="font-montserrat text-[26px] font-medium text-black">
        {name ? `Hi! ${name}` : "Hi!"}
      </p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <StatPair
          leftLabel="Total Income"
          leftValue={formatAmount(statsQuery.data.totalIncome)}
          rightLabel="Payment Transaction"
          rightValue={String(statsQuery.data.incomeTxCount)}
        />
        <StatPair
          leftLabel="Total Payout"
          leftValue={formatAmount(statsQuery.data.totalPayout)}
          rightLabel="Payout Transaction"
          rightValue={String(statsQuery.data.payoutTxCount)}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <PaymentVolumeCard range={range} onRangeChange={setRange} points={points} />
        <OpenRequestsCard requests={openQuery.data ?? []} />
      </div>
      <RecentPaymentsTable rows={recentQuery.data ?? []} />
    </div>
  );
}
