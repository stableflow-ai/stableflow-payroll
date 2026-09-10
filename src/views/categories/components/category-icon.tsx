import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORY_LOCAL_ART } from "../config";

export function CategoryIcon(props: {
  category: string;
  src: string;
  className?: string;
}) {
  const fallback = CATEGORY_LOCAL_ART[props.category]?.iconSrc ?? "";
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [props.category, props.src]);
  const current = (!failed && props.src.trim()) || fallback;
  if (!current) return <span className={cn("size-8 shrink-0", props.className)} />;
  return (
    <span className={cn("size-8 shrink-0 overflow-clip", props.className)}>
      <img
        src={current}
        alt=""
        className="size-8"
        onError={() => {
          if (fallback && current !== fallback) setFailed(true);
        }}
      />
    </span>
  );
}
