import { Card } from "@/components/ui/card/Card";
import type { NetworkShare } from "@/mocks/analytics";

export function PayoutNetworksCard({ items }: { items: NetworkShare[] }) {
  return (
    <Card className="flex min-h-[356px] flex-col">
      <h2 className="font-montserrat text-lg font-medium capitalize text-black">
        Payout Networks
      </h2>
      <ul className="mt-6 flex flex-1 flex-col justify-between gap-4">
        {items.map((item) => (
          <li key={item.network} className="flex items-center gap-3">
            <span className="w-[88px] shrink-0 font-montserrat text-sm font-medium text-black">
              {item.network}
            </span>
            <span className="relative h-2.5 min-w-0 flex-1 rounded-[12px] bg-[#e3e3e3]">
              <span
                className="absolute inset-y-0 left-0 rounded-[12px] bg-black"
                style={{ width: `${Math.min(100, Math.max(0, item.percent))}%` }}
              />
            </span>
            <span className="w-10 shrink-0 text-right font-montserrat text-sm font-medium text-black">
              {item.percent}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
