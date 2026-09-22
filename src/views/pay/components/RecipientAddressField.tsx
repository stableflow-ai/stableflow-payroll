import { RecipientAvatar } from "@/components/recipient-avatar/RecipientAvatar";
import { Autocomplete, type AutocompleteOption } from "@/components/ui/autocomplete/Autocomplete";
import { IconBook } from "@/components/icons/book";
import { IconClose } from "@/components/icons/close";
import { IconSearch } from "@/components/icons/search";
import type { Contact } from "@/hooks/use-contacts";
import { formatAddress } from "@/utils";
import type { RecipientSuggestion } from "./single-payout/utils";

export function RecipientAddressField(props: {
  value: string;
  matched: Contact | null;
  onChange: (value: string) => void;
  onClear: () => void;
  onOpenBook: () => void;
  locked?: boolean;
  suggestions?: RecipientSuggestion[];
  suggestOpen?: boolean;
  suggestLoading?: boolean;
  onSuggestOpenChange?: (open: boolean) => void;
  onSelectSuggestion?: (row: RecipientSuggestion) => void;
  addressError?: string | null;
}) {
  const {
    value,
    matched,
    onChange,
    onClear,
    onOpenBook,
    locked = false,
    suggestions = [],
    suggestOpen = false,
    suggestLoading = false,
    onSuggestOpenChange,
    onSelectSuggestion,
    addressError,
  } = props;

  const options: AutocompleteOption[] = suggestions.map((row) => ({
    value: row.id,
    label: row.contact.name,
  }));
  const selectedOptionId = matched
    ? suggestions.find((row) => row.wallet === matched.wallet)?.id
    : undefined;

  return (
    <div>
      <p className="font-montserrat text-sm font-medium text-[#606060]">
        Recipient
      </p>
      <div className="mt-2 flex items-center gap-3">
        <Autocomplete
          className="min-w-0 flex-1"
          open={suggestOpen && !locked}
          onOpenChange={onSuggestOpenChange}
          options={options}
          value={selectedOptionId}
          loading={suggestLoading}
          onSelect={(id) => {
            const row = suggestions.find((item) => item.id === id);
            if (row) onSelectSuggestion?.(row);
          }}
          renderOption={(option) => {
            const row = suggestions.find((item) => item.id === option.value);
            if (!row) return option.label;
            return (
              <div className="flex min-w-0 items-center gap-2">
                <RecipientAvatar
                  name={row.contact.name}
                  address={row.wallet}
                  className="size-6 text-[10px]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-montserrat text-sm font-medium text-black">
                    {row.contact.name}
                  </p>
                  <p className="font-montserrat text-[10px] text-[#606060]">
                    {formatAddress(row.wallet)}
                  </p>
                </div>
              </div>
            );
          }}
        >
          <div className="flex h-10 min-w-0 w-full items-center rounded-[8px] border border-[#ebebeb] bg-white pr-2 pl-3">
            {matched ? null : (
              <IconSearch className="mr-2 size-3.5 shrink-0 text-[#909090]" />
            )}
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
              onChange={(event) => {
                const next = event.target.value;
                if (matched) onSuggestOpenChange?.(true);
                onChange(next);
              }}
              onFocus={() => {
                if (!locked && !matched) onSuggestOpenChange?.(true);
              }}
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
        </Autocomplete>
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
      {addressError ? (
        <p className="mt-1.5 font-montserrat text-xs text-[#c00]">{addressError}</p>
      ) : null}
    </div>
  );
}
