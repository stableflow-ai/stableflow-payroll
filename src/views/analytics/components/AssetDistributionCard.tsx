import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card/Card";
import type { AssetShare } from "../config";
import { ASSET_COLOR_FALLBACK, ASSET_COLORS } from "../config";

function assetColor(symbol: string, index: number) {
  return ASSET_COLORS[symbol] ?? ASSET_COLOR_FALLBACK[index % ASSET_COLOR_FALLBACK.length];
}

function DistributionTooltip(props: {
  active?: boolean;
  symbol?: string;
  value?: number;
}) {
  const { active, symbol, value } = props;
  if (!active || value == null) return null;
  return (
    <div className="rounded-[12px] bg-white px-3 py-2 font-montserrat shadow-[0_0_20px_rgba(0,0,0,0.06)]">
      {symbol ? <p className="text-xs text-[#909090]">{symbol}</p> : null}
      <p className="text-sm font-medium text-black">{value}%</p>
    </div>
  );
}

export function AssetDistributionCard({ items }: { items: AssetShare[] }) {
  return (
    <Card className="flex min-h-[356px] flex-col">
      <h2 className="font-montserrat text-lg font-medium capitalize text-black">
        Asset Distribution
      </h2>
      <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-6">
        <div className="h-[183px] w-[183px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items}
                dataKey="percent"
                nameKey="symbol"
                innerRadius={52}
                outerRadius={90}
                stroke="none"
              >
                {items.map((item, index) => (
                  <Cell key={item.symbol} fill={assetColor(item.symbol, index)} />
                ))}
              </Pie>
              <Tooltip
                content={(tooltipProps) => {
                  const item = tooltipProps.payload?.[0];
                  const share = item?.payload as AssetShare | undefined;
                  return (
                    <DistributionTooltip
                      active={tooltipProps.active}
                      symbol={share?.symbol}
                      value={typeof item?.value === "number" ? item.value : undefined}
                    />
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex flex-wrap items-start justify-center gap-x-6 gap-y-2">
          {items.map((item, index) => (
            <li key={item.symbol} className="flex flex-col">
              <span className="inline-flex items-center gap-1.5 font-montserrat text-sm font-medium text-black">
                <span
                  className="size-2.5 rounded-[2px]"
                  style={{ backgroundColor: assetColor(item.symbol, index) }}
                />
                {item.symbol}
              </span>
              <span className="pl-4 font-montserrat text-sm font-medium text-black">
                {item.percent}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
