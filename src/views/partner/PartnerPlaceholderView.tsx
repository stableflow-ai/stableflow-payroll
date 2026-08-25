import { useLocation } from "react-router-dom";
import { PARTNER_NAV_ITEMS } from "./config";

export function PartnerPlaceholderView() {
  const { pathname } = useLocation();
  const item = PARTNER_NAV_ITEMS.find((entry) => entry.to === pathname);

  return (
    <div>
      <h1 className="font-montserrat text-[26px] font-semibold text-black">
        {item?.label ?? "Partner"}
      </h1>
      <div className="mx-auto w-full max-w-[1212px]">
        <p className="mt-6 font-montserrat text-sm font-medium text-[#606060]">Coming soon</p>
      </div>
    </div>
  );
}
