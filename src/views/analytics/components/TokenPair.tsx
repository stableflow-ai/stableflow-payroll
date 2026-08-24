import { Icon2Right } from "@/components/icons/to-right";
import { chainLogoUrl, tokenLogoUrl } from "@/lib/logo";
import type { AssetToken } from "@/mocks/analytics";

function TokenMark({ token }: { token: AssetToken }) {
  return (
    <span className="relative size-6 shrink-0">
      <img
        src={tokenLogoUrl(token.symbol)}
        alt=""
        className="size-6 rounded-[12px] object-cover"
      />
      <img
        src={chainLogoUrl(token.network)}
        alt=""
        className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-[2px] border border-white object-cover"
      />
    </span>
  );
}

export function TokenPair(props: {
  origin: AssetToken;
  dest: AssetToken;
}) {
  const { origin, dest } = props;

  return (
    <span className="inline-flex items-center gap-1">
      <TokenMark token={origin} />
      <Icon2Right className="h-2 w-3 shrink-0 text-black" />
      <TokenMark token={dest} />
    </span>
  );
}
