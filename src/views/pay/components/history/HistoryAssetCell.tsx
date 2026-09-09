import { chainDisplayName } from "@/config/chains";
import { tokenLogoUrl } from "@/lib/logo";

export function HistoryAssetCell(props: { symbol: string; network: string }) {
  const { symbol, network } = props;
  const token = symbol.trim();
  if (!token) {
    return <span>-</span>;
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <img
        src={tokenLogoUrl(token)}
        alt=""
        className="size-5 shrink-0 rounded-[12px] object-cover"
      />
      <span className="truncate">
        {token} · {chainDisplayName(network)}
      </span>
    </span>
  );
}
