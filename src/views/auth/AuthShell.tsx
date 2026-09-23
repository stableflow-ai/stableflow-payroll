import { lazy, Suspense, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { getLogo } from "@/lib/logo";
import { cn } from "@/lib/utils";
import { AUTH_PANEL_BG } from "./config";

const MagicRings = lazy(() => import("@/components/magic-rings/MagicRings"));

const STABLEFLOW_WORDMARK = getLogo("/stableflow/logos/logo-stableflow-full-light.svg");

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
    <main className="flex min-h-svh flex-col-reverse md:flex-row">
      <aside
        className={cn(
          "relative flex w-full shrink-0 flex-col overflow-hidden bg-black px-6 py-8 md:w-[min(870px,57.5%)] md:min-h-svh md:px-16 md:py-14 lg:px-16 xl:px-30",
        )}
      >
        <div className="absolute inset-0" aria-hidden>
          <Suspense fallback={null}>
            <MagicRings
              followMouse={false}
              clickBurst={false}
              fadeOut={2.6}
              attenuation={7}
              lineThickness={2.4}
              ringCount={6}
              baseRadius={0.32}
              radiusStep={0.12}
              scaleRate={0.1}
            />
          </Suspense>
        </div>

        <div className="pointer-events-none relative z-10 flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex items-center gap-3">
            <img src={STABLEFLOW_WORDMARK} alt="StableFlow" className="h-10 w-auto" />
            <img src="/logo.svg" alt="Payouts" className="h-[30px] w-auto" />
          </div>
          <h1 className="mt-7 font-montserrat text-[28px] leading-tight text-white md:text-[36px]">
            <span className="font-normal">One Simple Flow For </span>
            <span className="font-semibold">Payouts</span>
          </h1>
          <p className="mt-1.5 font-montserrat text-[14px] font-normal leading-[1.5] text-white">
            Finance and ops teams running recurring on-chain payments.
          </p>
        </div>
        <Link
          to="/docs"
          className="pointer-events-auto absolute bottom-10.5 left-6 z-10 font-montserrat text-sm font-normal text-white transition-opacity hover:opacity-70 md:left-12.5"
        >
          Docs
        </Link>
      </aside>

      <section
        className="relative flex flex-1 flex-col items-center justify-start px-4 py-10 sm:px-6 md:justify-center md:py-12"
        style={{ backgroundColor: AUTH_PANEL_BG }}
      >
        <div className={cn("relative z-10 flex w-full flex-col items-center", contentClassName)}>
          {panelTop ? <div className="mb-5 flex justify-center">{panelTop}</div> : null}
          {children}
        </div>
      </section>
    </main>
  );
}
