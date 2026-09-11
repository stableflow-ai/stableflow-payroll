import type { ComponentType, CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { IconLock, IconNode, IconShield } from "@/components/icons";
import { cn } from "@/lib/utils";
import { AUTH_BRAND_BG, AUTH_PANEL_BG, type AuthFeatureIconKey } from "./config";

const FEATURE_ICONS: Record<
  AuthFeatureIconKey,
  ComponentType<{ className?: string; style?: CSSProperties }>
> = {
  lock: IconLock,
  shield: IconShield,
  node: IconNode,
};

const FEATURES = [
  { icon: "lock" as AuthFeatureIconKey, title: "Confidential by default" },
  { icon: "shield" as AuthFeatureIconKey, title: "Self-custodial" },
  { icon: "node" as AuthFeatureIconKey, title: "Cross-chain" },
] as const;

export function AuthShell({
  children,
  panelTop,
  contentClassName,
}: {
  children: ReactNode;
  panelTop?: ReactNode;
  contentClassName?: string;
}) {
  return (
    <main className="flex min-h-svh flex-col md:flex-row">
      <aside
        className={cn(
          "relative flex w-full shrink-0 flex-col overflow-hidden px-6 py-8 md:w-[min(870px,57.5%)] md:min-h-svh md:px-16 md:py-14 lg:px-20",
          "bg-[url('/auth/brand-mark-vector.svg')] bg-no-repeat bg-[position:left_center] bg-[length:694px_auto]",
        )}
        style={{ backgroundColor: AUTH_BRAND_BG }}
      >

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <img
            src="/logo-white.svg"
            alt="Pay. Stableflow"
            className="h-auto w-[112px]"
            width={112}
            height={34}
          />

          <h1 className="mt-10 max-w-[558px] font-montserrat text-[28px] font-semibold capitalize leading-tight text-white md:mt-16 md:text-[36px]">
            Confidential Payments.
          </h1>
          <p className="mt-3 max-w-[558px] font-montserrat text-[14px] font-normal leading-[1.5] text-white md:mt-4">
            Send across chains without creating a direct public link between sender and recipient.
          </p>

          <ul className="mt-8 hidden flex-col gap-8 md:mt-10 md:flex">
            {FEATURES.map((feature) => {
              const Icon = FEATURE_ICONS[feature.icon];
              return (
                <li key={feature.title} className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center text-white bg-black/10 rounded-[8px]" aria-hidden>
                    <Icon className="size-4" />
                  </span>
                  <p className="font-montserrat text-[16px] font-semibold capitalize text-white">
                    {feature.title}
                  </p>
                </li>
              );
            })}
          </ul>

          <Link
            to="/howitworks"
            className="mt-8 inline-flex items-center font-montserrat text-sm font-normal text-white transition-opacity hover:opacity-70 md:mt-auto md:pt-10"
          >
            How it works
          </Link>
        </div>
      </aside>

      <section
        className="relative flex flex-1 flex-col items-center justify-start px-4 py-10 sm:px-6 md:justify-center md:py-12"
        style={{ backgroundColor: AUTH_PANEL_BG }}
      >
        <div className={cn("relative z-10 flex w-full flex-col items-center", contentClassName)}>
          {panelTop ? <div className="mb-8 flex justify-center">{panelTop}</div> : null}
          {children}
        </div>
      </section>
    </main>
  );
}
