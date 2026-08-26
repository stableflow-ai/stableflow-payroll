import { chainDisplayName } from "@/config/chains";
import { tokenLogoUrl } from "@/lib/logo";

export type ReportsAsset = {
  symbol: string;
  network: string;
};

export function ReportsAssetCell({ asset }: { asset: ReportsAsset }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <img
        src={tokenLogoUrl(asset.symbol)}
        alt=""
        className="size-5 shrink-0 rounded-[12px] object-cover"
      />
      <span className="truncate">
        {asset.symbol} · {chainDisplayName(asset.network)}
      </span>
    </span>
  );
}
