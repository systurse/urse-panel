/**
 * `<input type="time">` reads and writes `HH:MM`, while the API validates
 * `H:i:s`. Converting in both directions keeps a save from being rejected with
 * a 422, and keeps an edit from silently blanking the field because the browser
 * refuses the seconds it never emitted.
 */

const INPUT_TIME_LENGTH = 5

/** `08:00` -> `08:00:00`. Empty stays null, since the fields are optional. */
export function normalizeTimeToApi (value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim()

  if (!trimmed) {
    return null
  }

  return trimmed.length === INPUT_TIME_LENGTH ? `${trimmed}:00` : trimmed
}

/** `08:00:00` -> `08:00`, the only shape the time input accepts. */
export function normalizeTimeToInput (value: string | null | undefined): string {
  return value ? value.slice(0, INPUT_TIME_LENGTH) : ''
}
