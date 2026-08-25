import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { pathname } = useLocation();
  const isSidebarLayout = pathname.startsWith("/pay") || pathname.startsWith("/partner");

  return (
    <div className="min-h-svh bg-[#f6f6f6]">
      <AppHeader />
      <main
        className={cn(
          "w-full",
          isSidebarLayout
            ? ""
            : "mx-auto max-w-[1252px] px-2 py-6 md:px-5 lg:py-8",
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
