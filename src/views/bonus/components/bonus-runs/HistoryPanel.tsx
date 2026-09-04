import { formatAmount } from "@/utils";
import type { BonusHistoryItem } from "@/mocks/bonus";

export function HistoryPanel({ items }: { items: BonusHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <p className="font-montserrat text-sm text-[#aaa]">No bonus history</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {items.map((item) => (
        <article
          key={item.id}
          className="min-h-[100px] rounded-[20px] border border-[#f0f0f0] px-[30px] py-5 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]"
        >
          <h3 className="font-montserrat text-[20px] font-semibold text-black">
            {item.title}
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="font-montserrat text-sm font-medium text-[#aaa]">
                Total Payout
              </p>
              <p className="mt-2 font-montserrat text-sm font-medium text-black">
                {formatAmount(item.totalPayout)}
              </p>
            </div>
            <div>
              <p className="font-montserrat text-sm font-medium text-[#aaa]">
                Members
              </p>
              <p className="mt-2 font-montserrat text-sm font-medium text-black">
                {item.memberCount}
              </p>
            </div>
            <div>
              <p className="font-montserrat text-sm font-medium text-[#aaa]">
                Execution Time
              </p>
              <p className="mt-2 font-montserrat text-sm font-medium text-black">
                {item.executedAt}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
