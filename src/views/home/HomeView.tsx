import { useState } from "react";
import { useHomeDashboard } from "@/hooks/use-home-dashboard";
import { primaryConnectedAddress, useConnectedWallets } from "@/hooks/use-wallet";
import { useAuthStore } from "@/stores/auth";
import type { VolumeRange } from "@/mocks/home";
import { PaymentVolumeCard } from "./components/PaymentVolumeCard";
import { PendingPayoutsCard } from "./components/PendingPayoutsCard";
import { RecentPayoutsTable } from "./components/RecentPayoutsTable";
import { SummaryCard } from "./components/SummaryCard";
import { DEFAULT_VOLUME_RANGE } from "./config";

export function HomeView() {
  const user = useAuthStore((state) => state.user);
  const owners = useConnectedWallets();
  const hasWallet = Boolean(primaryConnectedAddress(owners));
  const [range, setRange] = useState<VolumeRange>(DEFAULT_VOLUME_RANGE);
  const dashboard = useHomeDashboard(range);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-montserrat text-[26px] font-medium text-black">
        Hi! {user?.name}
      </h1>
      <SummaryCard dashboard={dashboard} hasWallet={hasWallet} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,392px)]">
        <PaymentVolumeCard
          range={range}
          onRangeChange={setRange}
          points={dashboard.volume}
        />
        <PendingPayoutsCard items={dashboard.pendingPayouts} />
      </div>
      <RecentPayoutsTable items={dashboard.recentPayouts} />
    </div>
  );
}
