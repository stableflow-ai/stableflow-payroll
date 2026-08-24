import { tokenLogoUrl } from "@/lib/logo";
import type { PartnerReportAsset } from "@/mocks/partner";

export function ReportsAssetCell({ asset }: { asset: PartnerReportAsset }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <img
        src={tokenLogoUrl(asset.symbol)}
        alt=""
        className="size-5 shrink-0 rounded-[12px] object-cover"
      />
      <span className="truncate">
        {asset.symbol} · {asset.network}
      </span>
    </span>
  );
}
