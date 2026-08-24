import type { InputHTMLAttributes } from "react";
import { IconClose } from "@/components/icons/close";
import { IconSearch } from "@/components/icons/search";
import { cn } from "@/lib/utils";

export type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  inputClassName?: string;
};

export function SearchInput(props: SearchInputProps) {
  const {
    value,
    onChange,
    placeholder = "Search",
    className,
    inputClassName,
    disabled,
    ...restProps
  } = props;
  const hasValue = value.length > 0;

  return (
    <label className={cn("relative block w-full", className)}>
      <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#909090]" />
      <input
        {...restProps}
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-9 w-full rounded-[18px] border border-[#ebebeb] bg-white font-montserrat text-sm font-normal text-black outline-none placeholder:text-[#909090]",
          "appearance-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          hasValue ? "pr-8 pl-9" : "pr-3 pl-9",
          disabled && "cursor-not-allowed opacity-30",
          inputClassName,
        )}
      />
      {hasValue ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 inline-flex size-5 -translate-y-1/2 items-center justify-center text-[#909090] hover:text-black disabled:pointer-events-none"
        >
          <IconClose className="size-2.5" />
        </button>
      ) : null}
    </label>
  );
}

export default SearchInput;
