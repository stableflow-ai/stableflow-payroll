import { getLogo } from "@/lib/logo";

const STABLEFLOW_MARK = getLogo("/stableflow/logos/logo-stableflow.svg");

export function BrandGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -top-[197px] -left-[31px] size-[265px] rounded-full bg-[radial-gradient(circle_at_center,rgba(198,214,255,0.72)_0%,rgba(160,186,255,0.28)_38%,transparent_70%)]"
    />
  );
}

export function BrandMark() {
  return (
    <span className="inline-flex items-center gap-1">
      <img src={STABLEFLOW_MARK} alt="StableFlow" className="h-9 w-auto" />
      <img src="/logo-white.svg" alt="Payouts" className="h-[26px] w-auto" />
    </span>
  );
}
