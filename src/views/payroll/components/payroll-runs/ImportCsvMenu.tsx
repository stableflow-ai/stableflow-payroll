import { IconCloud } from "@/components/icons/cloud";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { cn } from "@/lib/utils";

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

function OptionList(props: {
  onSelect: (value: ImportCsvSource) => void;
}) {
  const { onSelect } = props;
  return (
    <div className="flex flex-col py-1">
      {IMPORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className="flex h-[47px] w-full items-center gap-2 px-4 text-left font-montserrat text-sm font-medium text-black hover:bg-[#f6f6f6]"
        >
          <OptionIcon icon={option.icon} />
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ImportCsvMenu(props: {
  open: boolean;
  isDesktop: boolean;
  onClose: () => void;
  onSelect: (value: ImportCsvSource) => void;
}) {
  const { open, isDesktop, onClose, onSelect } = props;

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
        "absolute top-full left-0 z-20 mt-1.5 w-[167px] overflow-hidden rounded-[12px]",
        "border border-[#e0e0e0] bg-[#fdfdfd] shadow-[0_0_20px_0_rgba(0,0,0,0.06)]",
      )}
    >
      <OptionList onSelect={handleSelect} />
    </div>
  );
}
