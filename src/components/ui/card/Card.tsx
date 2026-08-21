import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-white bg-[#FDFDFD] p-5 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]",
        className,
      )}
      {...props}
    />
  );
}

export default Card;
