import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { IconLogout } from "@/components/icons/logout";
import { IconMenu } from "@/components/icons/menu";
import { IconResetPassword } from "@/components/icons/reset-password";
import {
  FLOATING_ALIGN,
  FLOATING_SIDE,
  useFloatingPosition,
} from "@/components/ui/overlay/use-floating-position";
import { useAuthStore } from "@/stores/auth";
import { ResetPasswordDialog } from "@/views/auth/ResetPasswordDialog";
import { RESET_PASSWORD_VARIANT } from "@/views/auth/config";
import { HEADER_AVATAR_SRC } from "./config";

export function HeaderAccountMenu() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const panelStyle = useFloatingPosition({
    open,
    triggerRef,
    panelRef,
    side: FLOATING_SIDE.Bottom,
    align: FLOATING_ALIGN.End,
    offset: 8,
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
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const closeAndLogout = () => {
    setOpen(false);
    logout();
    navigate("/login");
  };

  const openResetPassword = () => {
    setOpen(false);
    setResetOpen(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 w-[74px] items-center justify-between rounded-[20px] border border-white bg-[#fdfdfd] pr-3.5 pl-1 shadow-[0_0_20px_rgba(0,0,0,0.06)]"
      >
        <img
          src={HEADER_AVATAR_SRC}
          alt=""
          className="size-[30px] rounded-full object-cover"
        />
        <IconMenu className="text-black" />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="menu"
              style={panelStyle}
              className="z-1100 w-[249px] overflow-hidden rounded-[12px] border border-[#E0E0E0] bg-[#fdfdfd] shadow-[0_0_20px_rgba(0,0,0,0.06)]"
            >
              <div className="flex h-[70px] items-center gap-2 px-4">
                <img
                  src={HEADER_AVATAR_SRC}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-montserrat text-base font-medium text-black">
                    {user?.name}
                  </p>
                  <p className="truncate font-montserrat text-sm font-normal text-black">{user?.email}</p>
                </div>
              </div>
              <div className="h-px bg-[#E0E0E0]" />
              <div className="py-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={openResetPassword}
                  className="flex h-10 w-full duration-150 hover:text-black items-center gap-2.5 px-[19px] font-montserrat text-sm font-medium text-[#606060]"
                >
                  <IconResetPassword className="shrink-0" />
                  Reset Password
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={closeAndLogout}
                  className="flex h-10 w-full duration-150 hover:text-danger items-center gap-2.5 px-[19px] font-montserrat text-sm font-medium text-[#606060]"
                >
                  <IconLogout className="shrink-0" />
                  Logout
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
      <ResetPasswordDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        variant={RESET_PASSWORD_VARIANT.Authed}
      />
    </>
  );
}
