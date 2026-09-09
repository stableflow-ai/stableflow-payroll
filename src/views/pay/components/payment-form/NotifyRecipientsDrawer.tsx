import { IconCheck } from "@/components/icons";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { Switch } from "@/components/ui/switch/Switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { PayableItem } from "@/types/payable";
import { PAYMENT_FORM_DETAILS_DESKTOP_QUERY } from "./config";

const ROW_GRID = "grid grid-cols-[1fr_1fr_16px] items-center gap-x-3";

export function NotifyRecipientsDrawer(props: {
  open: boolean;
  onClose: () => void;
  items: readonly PayableItem[];
  selectedIds: ReadonlySet<number>;
  onToggle: (id: number, checked: boolean) => void;
  onMasterChange: (checked: boolean) => void;
}) {
  const { open, onClose, items, selectedIds, onToggle, onMasterChange } = props;
  const isDesktop = useMediaQuery(PAYMENT_FORM_DETAILS_DESKTOP_QUERY);
  const masterOn = selectedIds.size > 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side={isDesktop ? DRAWER_SIDE.Right : DRAWER_SIDE.Bottom}
      title="Notify Recipients"
      headerAction={
        <div className="ml-auto absolute right-6 translate-y-0.5">
          <Switch
            checked={masterOn}
            onCheckedChange={onMasterChange}
            aria-label="Notify Recipients"
          />
        </div>
      }
      panelClassName={isDesktop ? "w-[min(100%,520px)]" : undefined}
      cardClassName={cn(
        "gap-6 p-6 sm:p-10",
        !isDesktop && "w-full max-h-[90vh] rounded-b-none",
      )}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className={cn(ROW_GRID, "px-4")}>
          <p className="font-montserrat text-sm font-medium text-[#aaa]">Recipients</p>
          <p className="font-montserrat text-sm font-medium text-[#aaa]">Email</p>
          <span />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto">
          {items.map((item) => {
            const checked = selectedIds.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={cn(ROW_GRID, "h-14 rounded-[12px] bg-[#f6f6f6] px-4 text-left")}
                onClick={() => onToggle(item.id, !checked)}
              >
                <p className="min-w-0 truncate font-montserrat text-sm font-medium text-black">
                  {item.name || "-"}
                </p>
                <p className="min-w-0 truncate font-montserrat text-sm font-medium text-black">
                  {item.email || "-"}
                </p>
                <span
                  className={cn(
                    "inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                    checked
                      ? "border-[#06F] bg-[#06F] text-white"
                      : "border-[#d9d9d9] bg-white text-transparent",
                  )}
                >
                  <IconCheck className="size-2.5" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Drawer>
  );
}
