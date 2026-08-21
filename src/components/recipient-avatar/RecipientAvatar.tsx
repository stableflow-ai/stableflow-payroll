import { cn } from "@/lib/utils";
import { AVATAR_COLORS } from "./config";

function hashAddress(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i += 1) {
    hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export function avatarColorForAddress(address: string): string {
  return AVATAR_COLORS[hashAddress(address) % AVATAR_COLORS.length];
}

export function RecipientAvatar(props: {
  name: string;
  address: string;
  className?: string;
}) {
  const { name, address, className } = props;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-montserrat font-semibold text-white",
        className,
      )}
      style={{ backgroundColor: avatarColorForAddress(address) }}
    >
      {nameInitials(name)}
    </span>
  );
}
