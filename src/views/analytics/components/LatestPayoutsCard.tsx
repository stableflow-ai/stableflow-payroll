import { Card } from "@/components/ui/card/Card";
import { formatDate } from "@/utils";
import type { LatestPayout } from "../config";
import { TokenPair } from "./TokenPair";

export function LatestPayoutsCard({ items }: { items: LatestPayout[] }) {
  return (
    <Card className="flex min-h-[475px] flex-col">
      <div className="flex items-center gap-2">
        <div className="size-5 shrink-0 rounded-full bg-[#0ED000]/20 flex justify-center items-center">
          <div className="size-3 rounded-full shrink-0 bg-[#0ED000]"></div>
        </div>
        <h2 className="font-montserrat text-lg font-medium capitalize text-black">
          Latest Payouts
        </h2>
      </div>
      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex h-14 items-center justify-between gap-3 rounded-[12px] bg-[#f6f6f6] px-3"
          >
            <span className="min-w-0">
              <span className="block font-montserrat text-sm font-medium text-black">
                {item.statusLabel}
              </span>
              <span className="mt-0.5 block font-montserrat text-xs text-[#aaa]">
                {formatDate(item.time)}
              </span>
            </span>
            <TokenPair origin={item.origin} dest={item.dest} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
