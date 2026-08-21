import { RecipientAvatar } from "@/components/recipient-avatar/RecipientAvatar";
import { IconBook } from "@/components/icons/book";
import { IconClose } from "@/components/icons/close";
import type { Contact } from "@/hooks/use-contacts";

export function RecipientAddressField(props: {
  value: string;
  matched: Contact | null;
  onChange: (value: string) => void;
  onClear: () => void;
  onOpenBook: () => void;
}) {
  const { value, matched, onChange, onClear, onOpenBook } = props;

  return (
    <div>
      <p className="font-montserrat text-sm font-medium text-[#606060]">
        Recipient’s wallet address
      </p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex h-9 min-w-0 flex-1 items-center rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] pr-2 pl-2">
          {matched ? (
            <span className="mr-2 inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-[8px] border border-black/10 bg-white px-1.5">
              <RecipientAvatar name={matched.name} address={matched.address} className="size-5 text-[10px]" />
              <span className="max-w-[72px] truncate font-montserrat text-sm font-medium text-black">
                {matched.name}
              </span>
            </span>
          ) : null}
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30"
            placeholder="Wallet address"
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
        </div>
        <button
          type="button"
          aria-label="Open recipients"
          onClick={onOpenBook}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-[8px] border border-black/10 bg-white text-black"
        >
          <IconBook className="size-4" />
        </button>
      </div>
    </div>
  );
}
