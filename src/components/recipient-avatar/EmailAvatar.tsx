import { cn } from "@/lib/utils";
import { nameInitials } from "./RecipientAvatar";

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function emailAvatarSeed(email: string, name = ""): string {
  const trimmed = email.trim().toLowerCase();
  if (trimmed) return trimmed;
  const fromName = name.trim();
  return fromName || "?";
}

export function emailAvatarInitial(name: string, email: string): string {
  const fromName = nameInitials(name);
  if (fromName !== "?") return fromName.slice(0, 1);
  const local = email.trim().split("@")[0] ?? "";
  const letter = local.trim().slice(0, 1);
  return letter ? letter.toUpperCase() : "?";
}

export function emailAvatarGradient(seed: string): string {
  const hash = hashSeed(seed);
  const hueA = hash % 360;
  const hueB = (hash * 7 + 137) % 360;
  const satA = 70 + (hash % 21);
  const satB = 70 + ((hash >>> 8) % 21);
  const lightA = 45 + ((hash >>> 4) % 11);
  const lightB = 45 + ((hash >>> 12) % 11);
  return `linear-gradient(135deg, hsl(${hueA} ${satA}% ${lightA}%), hsl(${hueB} ${satB}% ${lightB}%))`;
}

export function EmailAvatar(props: {
  email: string;
  name?: string;
  className?: string;
}) {
  const { email, name = "", className } = props;
  const seed = emailAvatarSeed(email, name);
  const initial = emailAvatarInitial(name, email);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-montserrat font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]",
        className,
      )}
      style={{ backgroundImage: emailAvatarGradient(seed) }}
    >
      {initial}
    </span>
  );
}
