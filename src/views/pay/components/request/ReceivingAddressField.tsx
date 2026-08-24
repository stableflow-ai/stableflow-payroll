import { IconClose } from "@/components/icons/close";
import { BatchFieldStatus } from "@/views/pay/components/batch/BatchFieldStatus";
import { cn } from "@/lib/utils";
import { REQUEST_PAYMENT_COPY } from "../../config";

export function ReceivingAddressField(props: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  error: string | null;
  showStatus: boolean;
  placeholder?: string;
}) {
  const { value, onChange, onClear, error, showStatus, placeholder = "Wallet address" } = props;
  const invalid = showStatus && Boolean(error);

  return (
    <div>
      <p className="font-montserrat text-sm font-medium text-[#606060]">
        {REQUEST_PAYMENT_COPY.RECEIVING_ADDRESS}
      </p>
      <div
        className={cn(
          "mt-2 flex h-9 min-w-0 items-center rounded-[6px] border bg-[#f6f6f6] pr-2 pl-2",
          invalid ? "border-danger" : "border-[#e3e3e3]",
        )}
      >
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30",
            invalid ? "text-danger" : "text-black",
          )}
          placeholder={placeholder}
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear address"
            onClick={onClear}
            className="ml-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black"
          >
            <IconClose className="size-2.5" />
          </button>
        ) : null}
        {showStatus ? <BatchFieldStatus ok={!error} /> : null}
      </div>
    </div>
  );
}
