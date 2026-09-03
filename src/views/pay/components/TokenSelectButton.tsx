import { IconArrowDown } from "@/components/icons/arrow-down";
import { chainLogoUrl } from "@/lib/logo";
import type { IntentsToken } from "@/stores/intents-tokens";

export function TokenSelectButton(props: {
  token: IntentsToken | null;
  onClick: () => void;
  disabled?: boolean;
}) {
  const { token, onClick, disabled = false } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[18px] border border-black/10 px-2.5 font-montserrat text-sm font-medium text-black transition-colors hover:bg-black/5 disabled:pointer-events-none disabled:opacity-60"
    >
      {token ? (
        <>
          <span className="relative size-5">
            <img src={token.logo} alt="" className="size-5 rounded-full object-cover" />
            <img
              src={chainLogoUrl(token.blockchain)}
              alt=""
              className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-[2px] border border-white object-cover"
            />
          </span>
          {token.symbol}
        </>
      ) : (
        <>
          <span className="size-5 rounded-[12px] bg-[#d9d9d9]" />
          <span className="opacity-30">Token</span>
        </>
      )}
      <IconArrowDown className="h-1.5 w-2.5 text-black/60" />
    </button>
  );
}
