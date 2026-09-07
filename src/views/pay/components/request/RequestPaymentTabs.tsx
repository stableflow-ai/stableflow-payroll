import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PAY_REQUEST_TABS } from "../../config";

export function RequestPaymentTabs() {
  return (
    <nav className="flex h-full items-stretch gap-16">
      {PAY_REQUEST_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            cn(
              "relative flex items-center font-montserrat text-base text-black",
              isActive ? "font-semibold" : "font-medium",
            )
          }
        >
          {({ isActive }) => (
            <>
              {tab.label}
              {isActive ? (
                <span className="absolute bottom-0 left-1/2 h-[3px] w-[50px] -translate-x-1/2 bg-[#06f]" />
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
