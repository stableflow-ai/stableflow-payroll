import type { MouseEvent } from "react";
import { IconCloud } from "@/components/icons/cloud";
import { IconLogout } from "@/components/icons/logout";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { signOutGoogleDrive } from "@/lib/google/token-client";
import { cn } from "@/lib/utils";
import {
  isUsableGoogleDriveSession,
  useGoogleDriveSessionStore,
} from "@/stores/google-drive-session";

const IMPORT_OPTIONS = [
  { value: "file", label: "Choose file", icon: "cloud" as const },
  { value: "google", label: "Google Docs", icon: "google" as const },
] as const;

export type ImportCsvSource = (typeof IMPORT_OPTIONS)[number]["value"];

function OptionIcon({ icon }: { icon: "cloud" | "google" }) {
  if (icon === "google") {
    return (
      <img
        src="/payroll/google-docs.png"
        alt=""
        className="size-4 shrink-0 rounded-[4px] object-cover"
      />
    );
  }
  return <IconCloud className="size-3.5 shrink-0 text-black" />;
}

function GoogleDocsRow(props: { onSelect: () => void }) {
  const { onSelect } = props;
  const signedIn = useGoogleDriveSessionStore((state) => isUsableGoogleDriveSession(state));

  async function handleSignOut(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    await signOutGoogleDrive();
  }

  return (
    <div className="flex h-[47px] w-full items-center hover:bg-[#f6f6f6]">
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 px-4 text-left font-montserrat text-sm font-medium text-black"
      >
        <OptionIcon icon="google" />
        Google Docs
      </button>
      {signedIn ? (
        <button
          type="button"
          aria-label="Sign out of Google"
          className="mr-2 inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] text-black hover:text-danger hover:bg-black/5"
          onClick={(event) => void handleSignOut(event)}
        >
          <IconLogout className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function OptionList(props: { onSelect: (value: ImportCsvSource) => void }) {
  const { onSelect } = props;
  return (
    <div className="flex flex-col py-1">
      {IMPORT_OPTIONS.map((option) =>
        option.value === "google" ? (
          <GoogleDocsRow key={option.value} onSelect={() => onSelect(option.value)} />
        ) : (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className="flex h-[47px] w-full items-center gap-2 px-4 text-left font-montserrat text-sm font-medium text-black hover:bg-[#f6f6f6]"
          >
            <OptionIcon icon={option.icon} />
            {option.label}
          </button>
        ),
      )}
    </div>
  );
}

export function ImportCsvMenu(props: {
  open: boolean;
  isDesktop: boolean;
  onClose: () => void;
  onSelect: (value: ImportCsvSource) => void;
  align?: "start" | "end";
}) {
  const { open, isDesktop, onClose, onSelect, align = "start" } = props;

  function handleSelect(value: ImportCsvSource) {
    onSelect(value);
    onClose();
  }

  if (!open) return null;

  if (!isDesktop) {
    return (
      <Drawer
        open={open}
        onClose={onClose}
        side={DRAWER_SIDE.Bottom}
        title="Import CSV"
      >
        <OptionList onSelect={handleSelect} />
      </Drawer>
    );
  }

  return (
    <div
      className={cn(
        "absolute top-full z-20 mt-1.5 w-[200px] overflow-hidden rounded-[12px]",
        align === "end" ? "right-0" : "left-0",
        "border border-[#e0e0e0] bg-[#fdfdfd] shadow-[0_0_20px_0_rgba(0,0,0,0.06)]",
      )}
    >
      <OptionList onSelect={handleSelect} />
    </div>
  );
}
