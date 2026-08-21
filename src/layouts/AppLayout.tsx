import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { pathname } = useLocation();
  const isHomePage = pathname === "/";

  return (
    <div className="min-h-svh bg-[#f6f6f6]">
      <AppHeader />
      <main
        className={cn(
          "mx-auto w-full py-6 lg:py-8 px-2 md:px-5",
          isHomePage ? "max-w-[1252px]" : "max-w-[1512px]",
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
