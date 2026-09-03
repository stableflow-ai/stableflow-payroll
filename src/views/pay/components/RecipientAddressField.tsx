import { RecipientAvatar } from "@/components/recipient-avatar/RecipientAvatar";
import { IconBook } from "@/components/icons/book";
import { IconClose } from "@/components/icons/close";
import { IconSearch } from "@/components/icons/search";
import type { Contact } from "@/hooks/use-contacts";

export function RecipientAddressField(props: {
  value: string;
  matched: Contact | null;
  onChange: (value: string) => void;
  onClear: () => void;
  onOpenBook: () => void;
  locked?: boolean;
}) {
  const { value, matched, onChange, onClear, onOpenBook, locked = false } = props;

  return (
    <div>
      <p className="font-montserrat text-sm font-medium text-[#606060]">
        Recipient
      </p>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex h-10 min-w-0 flex-1 items-center rounded-[8px] border border-[#ebebeb] bg-white pr-2 pl-3">
          <IconSearch className="mr-2 size-3.5 shrink-0 text-[#909090]" />
          {matched ? (
            <span className="mr-2 inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-[8px] border border-black/10 bg-white px-1.5">
              <RecipientAvatar name={matched.name} address={matched.wallet} className="size-5 text-[10px]" />
              <span className="max-w-[72px] truncate font-montserrat text-sm font-medium text-black">
                {matched.name}
              </span>
            </span>
          ) : null}
          <input
            value={value}
            readOnly={locked}
            onChange={(event) => onChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent font-montserrat text-sm font-normal text-black outline-none placeholder:text-[#909090]"
            placeholder="Search name or paste address..."
          />
          {value && !locked ? (
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
        {!locked ? (
          <button
            type="button"
            aria-label="Open recipients"
            onClick={onOpenBook}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-black/10 bg-white text-[#5E5C5C]"
          >
            <IconBook className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
