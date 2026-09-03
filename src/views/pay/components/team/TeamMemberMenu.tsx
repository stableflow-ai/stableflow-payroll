import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconMore } from "@/components/icons/more";
import { IconPay } from "@/components/icons/pay";
import { IconPen } from "@/components/icons/pen";
import { IconRemove } from "@/components/icons/remove";
import {
  FLOATING_ALIGN,
  FLOATING_SIDE,
  useFloatingPosition,
} from "@/components/ui/overlay/use-floating-position";
import { cn } from "@/lib/utils";

export function TeamMemberMenu(props: {
  payDisabled?: boolean;
  onEdit: () => void;
  onPayNow: () => void;
  onRemove: () => void;
}) {
  const { payDisabled = false, onEdit, onPayNow, onRemove } = props;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const panelStyle = useFloatingPosition({
    open,
    triggerRef,
    panelRef,
    side: FLOATING_SIDE.Bottom,
    align: FLOATING_ALIGN.End,
    offset: 6,
  });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const closeAnd = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open member actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="inline-flex size-8 items-center justify-center rounded-full text-[#aaa] hover:bg-black/5 hover:text-black"
      >
        <IconMore className="h-3.5 w-[3px]" />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="menu"
              style={panelStyle}
              className="z-1100 w-[165px] overflow-hidden rounded-[12px] border border-[#E0E0E0] bg-[#fdfdfd] p-1.5 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]"
            >
              <MenuItem
                icon={<IconPen className="size-3 text-[#aaa]" />}
                label="Edit"
                onClick={() => closeAnd(onEdit)}
              />
              <MenuItem
                icon={<IconPay className="size-3.5 text-[#aaa]" />}
                label="Pay Now"
                disabled={payDisabled}
                onClick={() => closeAnd(onPayNow)}
              />
              <MenuItem
                icon={<IconRemove className="size-3.5 text-[#aaa]" />}
                label="Remove"
                onClick={() => closeAnd(onRemove)}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function MenuItem(props: {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const { icon, label, disabled, onClick } = props;
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-[42px] w-full items-center gap-2.5 rounded-[8px] px-2.5 font-montserrat text-sm font-medium text-black hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
