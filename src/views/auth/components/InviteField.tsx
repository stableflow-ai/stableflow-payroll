import { cn } from "@/lib/utils";
import { AUTH_COMPACT_INPUT_CLASS, AUTH_ONBOARDING_LABEL_CLASS } from "../config";

export function InviteField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  optional?: boolean;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  error?: string | null;
}) {
  const { id, label, value, onChange, onBlur, optional, placeholder, maxLength, autoFocus, error } = props;
  return (
    <div className="mt-5">
      <label htmlFor={id} className={AUTH_ONBOARDING_LABEL_CLASS}>
        {label}
        {optional ? (
          <span className="ml-1 font-montserrat text-xs font-medium text-[#aaa]">(optional)</span>
        ) : null}
      </label>
      <input
        id={id}
        className={cn(AUTH_COMPACT_INPUT_CLASS, "mt-2", error && "border-[#ff5656] text-[#ff5656]")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 font-montserrat text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
