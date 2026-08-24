import { Outlet } from "react-router-dom";
import { PartnerSidebar } from "@/views/partner/components/PartnerSidebar";

export function PartnerLayout() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <PartnerSidebar />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
