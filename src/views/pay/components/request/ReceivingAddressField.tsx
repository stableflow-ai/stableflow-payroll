import { cn } from "@/lib/utils";

const FIELD_CLASS =
  "mt-2 h-9 w-full rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30";

export function ReceivingAddressField(props: {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  showStatus: boolean;
  placeholder?: string;
}) {
  const { value, onChange, error, showStatus, placeholder = "Wallet address" } = props;
  const invalid = showStatus && Boolean(error);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-montserrat text-sm font-medium text-[#606060]">
          Receiving Address
        </p>
        <button
          type="button"
          className="inline-flex h-[30px] items-center rounded-[8px] border border-black/10 px-2.5 font-montserrat text-xs font-medium text-[#606060]"
        >
          Save as default
        </button>
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(FIELD_CLASS, invalid && "border-danger text-danger")}
      />
    </div>
  );
}
