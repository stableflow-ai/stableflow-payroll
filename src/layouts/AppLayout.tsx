import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { cn } from "@/lib/utils";
import { isPayShellPath } from "@/views/pay/config";

export function AppLayout() {
  const { pathname } = useLocation();
  const payShell = isPayShellPath(pathname);

  return (
    <div className={cn("bg-[#f6f6f6]", payShell ? "h-svh overflow-hidden" : "min-h-svh")}>
      {payShell ? null : <AppHeader />}
      <main
        className={cn(
          "w-full",
          payShell ? "h-full overflow-hidden" : "mx-auto max-w-[1252px] px-2 py-6 md:px-5 lg:py-8",
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
