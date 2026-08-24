import { cn } from "@/lib/utils";

const LABEL_CLASS = "font-montserrat text-sm font-medium text-[#606060]";
const INPUT_CLASS =
  "h-9 w-full rounded-[6px] border border-[#e3e3e3] bg-white px-3 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30 focus:border-[#c8c8c8]";
const TEXTAREA_CLASS =
  "h-[92px] w-full resize-none rounded-[6px] border border-[#e3e3e3] bg-white px-3 py-2 font-montserrat text-sm font-medium leading-normal text-black outline-none placeholder:text-black/30 focus:border-[#c8c8c8]";

type PartnerFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  optional?: boolean;
  autoComplete?: string;
  multiline?: boolean;
  className?: string;
};

export function PartnerField(props: PartnerFieldProps) {
  const {
    id,
    label,
    value,
    onChange,
    placeholder,
    maxLength,
    optional = false,
    autoComplete,
    multiline = false,
    className,
  } = props;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cn(LABEL_CLASS, "flex items-center gap-1")}>
        <span>{label}</span>
        {optional ? <span className="text-xs font-medium text-[#aaa]">(optional)</span> : null}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={TEXTAREA_CLASS}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={INPUT_CLASS}
        />
      )}
    </div>
  );
}
