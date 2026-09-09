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
          <button
            key={index}
            type="button"
            className="cursor-pointer text-[#6284F5] underline"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpenUrl(part.value);
            }}
          >
            {part.value}
          </button>
        );
      })}
    </>
  );
}
