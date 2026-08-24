import { Tooltip } from "@/components/ui/tooltip/Tooltip";

const MEMO_PREVIEW_MAX = 18;

export function PayoutMemoCell({ memo }: { memo?: string | null }) {
  const text = memo?.trim() ?? "";
  if (!text) return <span>-</span>;

  const truncated = text.length > MEMO_PREVIEW_MAX;
  const preview = truncated ? `${text.slice(0, MEMO_PREVIEW_MAX)}...` : text;

  if (!truncated) return <span className="truncate">{preview}</span>;

  return (
    <Tooltip
      content={
        <span className="block max-w-[190px]">
          <span className="block">Memo:</span>
          <span className="block">{text}</span>
        </span>
      }
    >
      <span className="truncate">{preview}</span>
    </Tooltip>
  );
}
