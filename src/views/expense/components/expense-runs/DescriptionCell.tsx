import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { LinkifiedText } from "./LinkifiedText";

export function DescriptionCell(props: {
  value: string;
  onOpenUrl: (url: string) => void;
}) {
  const { value, onOpenUrl } = props;
  const text = value.trim();
  if (!text) {
    return <span className="text-black">-</span>;
  }
  return (
    <Tooltip
      leaveDelay={150}
      triggerClassName="min-w-0 max-w-full"
      className="max-w-[320px] whitespace-normal"
      content={<LinkifiedText text={text} onOpenUrl={onOpenUrl} />}
    >
      <span className="block min-w-0 truncate font-normal text-black">
        <LinkifiedText text={text} onOpenUrl={onOpenUrl} />
      </span>
    </Tooltip>
  );
}
