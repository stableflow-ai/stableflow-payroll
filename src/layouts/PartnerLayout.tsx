import { Outlet } from "react-router-dom";
import { PartnerSidebar } from "@/views/partner/components/PartnerSidebar";

export function PartnerLayout() {
  return (
    <div className="flex flex-col gap-6 lg:min-h-[calc(100svh-63px)] lg:flex-row lg:gap-0">
      <PartnerSidebar />
      <div className="min-w-0 flex-1 px-2 py-6 md:px-5 lg:px-[39px] lg:py-8">
        <Outlet />
      </div>
    </div>
  );
}
