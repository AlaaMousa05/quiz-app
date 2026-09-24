import { normalizeArabicName } from "shared";

// Pure — operates on an already-fetched name, not a DB query, so it works
// equally for filtering a client-supplied list or a server-side candidate
// set without depending on how that set was loaded (FR-038).
export function matchesNameQuery(name: string, query: string): boolean {
  return normalizeArabicName(name).includes(normalizeArabicName(query));
}
