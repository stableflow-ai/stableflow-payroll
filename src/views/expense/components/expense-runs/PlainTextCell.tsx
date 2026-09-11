import { Tooltip } from "@/components/ui/tooltip/Tooltip";

export function PlainTextCell(props: {
  grouped?: boolean;
  value?: string;
}) {
  const { grouped = false, value } = props;
  if (grouped) {
    return <span className="font-medium text-black">-</span>;
  }
  const text = value?.trim() ?? "";
  if (!text) {
    return <span className="font-medium text-black">-</span>;
  }
  return (
    <Tooltip
      leaveDelay={150}
      triggerClassName="min-w-0 max-w-full"
      className="max-w-[320px] whitespace-normal"
      content={text}
    >
      <span className="block min-w-0 truncate font-medium text-black">{text}</span>
    </Tooltip>
  );
}
