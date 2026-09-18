/**
 * Abort a multisig watch when the quote deadline is reached.
 * Missing or invalid deadlines are ignored so older sessions keep polling.
 */
export function abortOnQuoteDeadline(
  deadline: string | undefined,
  abort: () => void,
  now = Date.now(),
): () => void {
  if (!deadline) return () => {};
  const ms = Date.parse(deadline);
  if (!Number.isFinite(ms)) return () => {};
  const remaining = ms - now;
  if (remaining <= 0) {
    abort();
    return () => {};
  }
  const timer = setTimeout(abort, remaining);
  return () => clearTimeout(timer);
}
