import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PAY_MODE_TABS } from "../config";

export function PaymentModeTabs() {
  return (
    <div className="mx-auto flex h-[42px] w-full max-w-[319px] items-center rounded-[12px] border border-[#e3e3e3] bg-white p-[5px]">
      {PAY_MODE_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            cn(
              "flex h-8 items-center justify-center rounded-[8px] px-3 font-montserrat text-sm font-medium",
              isActive ? "min-w-[140px] bg-black text-white" : "flex-1 text-[#606060]",
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
