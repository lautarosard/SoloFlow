/**
 * Deterministic accent per client, used for the 3px stripe on log cards.
 * Values live in index.css (--color-client-1..6). Proposal for the backend: a `color` column.
 */
const CLIENT_COLOR_COUNT = 6;

export function clientColorIndex(clientId: string): number {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = (hash * 31 + clientId.charCodeAt(i)) >>> 0;
  }
  return (hash % CLIENT_COLOR_COUNT) + 1;
}

export function clientColor(clientId: string): string {
  return `var(--color-client-${clientColorIndex(clientId)})`;
}

/** "Fintech Nova Inc." → "FN" when the client has no code. */
export function clientInitials(name: string, code?: string | null): string {
  if (code) return code;
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}
