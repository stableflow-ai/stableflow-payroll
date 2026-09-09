import { IconReceipt } from "@/components/icons/receipt";
import { splitHttpUrls } from "@/utils";

export function LinkifiedText(props: {
  text: string;
  onOpenUrl: (url: string) => void;
}) {
  const { text, onOpenUrl } = props;
  const parts = splitHttpUrls(text);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type !== "url") {
          return <span key={index}>{part.value}</span>;
        }
        return (
          <span
            key={index}
            className="inline-flex max-w-full items-start gap-1 align-middle"
          >
            <IconReceipt className="mt-0.5 size-3.5 shrink-0 text-[#6284F5]" />
            <button
              type="button"
              className="min-w-0 cursor-pointer break-all text-left text-[#6284F5] underline"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onOpenUrl(part.value);
              }}
            >
              {part.value}
            </button>
          </span>
        );
      })}
    </>
  );
}
