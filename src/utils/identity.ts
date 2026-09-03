const BLANK_IDS = new Set<unknown>([undefined, null, ''])

/**
 * Ids arrive as either numbers or strings depending on the endpoint and on how
 * each resource serializes them, so `===` between two of them fails silently:
 * `12 === '12'` is false. Comparing by value keeps a string id from hiding
 * every owner-only control at once.
 */
export function isSameId (
  left: number | string | null | undefined,
  right: number | string | null | undefined,
): boolean {
  if (BLANK_IDS.has(left) || BLANK_IDS.has(right)) {
    return false
  }

  return String(left) === String(right)
}
