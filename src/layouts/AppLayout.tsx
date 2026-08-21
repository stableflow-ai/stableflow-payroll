import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { pathname } = useLocation();
  const isPay = pathname === "/pay" || pathname.startsWith("/pay/");

  return (
    <div className="min-h-svh bg-[#f6f6f6]">
      <AppHeader />
      <main
        className={cn(
          "mx-auto w-full max-w-[1512px] py-6 lg:py-8",
          isPay ? "px-4 sm:px-6 lg:px-8" : "px-4 sm:px-6 lg:px-[150px]",
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
