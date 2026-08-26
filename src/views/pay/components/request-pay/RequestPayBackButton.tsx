import { useNavigate } from "react-router-dom";
import { IconArrowDown } from "@/components/icons/arrow-down";

export function RequestPayBackButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      className="inline-flex items-center gap-2.5 font-montserrat text-sm font-medium text-black transition-opacity hover:opacity-70"
    >
      <span
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white"
        aria-hidden
      >
        <IconArrowDown className="size-3 rotate-90 text-black" />
      </span>
      back
    </button>
  );
}
