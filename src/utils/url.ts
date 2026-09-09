export type LinkifyPart =
  | { type: "text"; value: string }
  | { type: "url"; value: string };

const HTTP_URL_RE = /https?:\/\/[^\s<>"'，,]+?(?=https?:\/\/|[\s<>"'，,]|$)/gi;
const TRAILING_PUNCTUATION_RE = /[),.;!?]+$/;

export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function splitHttpUrls(text: string): LinkifyPart[] {
  const parts: LinkifyPart[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(HTTP_URL_RE)) {
    const raw = match[0];
    const index = match.index ?? 0;
    const stripped = raw.replace(TRAILING_PUNCTUATION_RE, "");
    const url = isHttpUrl(stripped) ? stripped : raw;
    if (!isHttpUrl(url)) continue;
    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) });
    }
    parts.push({ type: "url", value: url });
    lastIndex = index + url.length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }
  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}
