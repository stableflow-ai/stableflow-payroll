import { Outlet } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";

export function AppLayout() {
  return (
    <div className="min-h-svh bg-[#f6f6f6]">
      <AppHeader />
      <main className="mx-auto w-full max-w-[1512px] px-4 py-6 sm:px-6 lg:px-[150px] lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
