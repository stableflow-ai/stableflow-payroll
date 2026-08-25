import { useState } from "react";
import { usePayOverviewQuery, usePaymentVolumeQuery, useRecentPaymentsQuery } from "@/hooks/use-payout-api";
import { usePendingPaymentsQuery } from "@/hooks/use-pending-payments";
import { useAuthStore } from "@/stores/auth";
import type { VolumePeriod } from "@/types/payout";
import { PaymentVolumeCard } from "./components/PaymentVolumeCard";
import { PendingPayoutsCard } from "./components/PendingPayoutsCard";
import { RecentPayoutsTable } from "./components/RecentPayoutsTable";
import { SummaryCard } from "./components/SummaryCard";
import { DEFAULT_VOLUME_PERIOD, HOME_LIST_LIMIT } from "./config";

export function HomeView() {
  const user = useAuthStore((state) => state.user);
  const [range, setRange] = useState<VolumePeriod>(DEFAULT_VOLUME_PERIOD);
  const overview = usePayOverviewQuery();
  const volume = usePaymentVolumeQuery(range);
  const pending = usePendingPaymentsQuery();
  const recent = useRecentPaymentsQuery();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-montserrat text-[26px] font-medium text-black">
        Hi! {user?.name}
      </h1>
      <SummaryCard
        totalPayment={overview.data?.totalPayment ?? null}
        recipients={overview.data?.recipients ?? null}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,392px)]">
        <PaymentVolumeCard
          range={range}
          onRangeChange={setRange}
          points={volume.data ?? []}
        />
        <PendingPayoutsCard
          items={(pending.data ?? []).slice(0, HOME_LIST_LIMIT)}
          loading={pending.isPending}
        />
      </div>
      <RecentPayoutsTable
        items={(recent.data ?? []).slice(0, HOME_LIST_LIMIT)}
        loading={recent.isPending}
      />
    </div>
  );
}
