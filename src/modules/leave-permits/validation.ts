/**
 * The three rules the backend answers with 422. Replicated here so the person
 * finds out before the round trip, not after. The API stays the authority: its
 * message is what gets shown when it still rejects.
 */

const MS_PER_HOUR = 60 * 60 * 1000
const REQUIRED_NOTICE_HOURS = 48

export const LEAVE_PERMIT_MESSAGES = {
  endsBeforeStarts: 'El último día del permiso no puede ser anterior al primero.',
  notice: 'El permiso debe solicitarse con al menos 48 horas de anticipación.',
  weekend: 'El permiso no puede iniciar ni terminar en sábado o domingo.',
} as const

/**
 * `new Date('2026-09-07')` is parsed as UTC midnight, which lands on the
 * previous day in any negative offset and would shift a Monday onto Sunday.
 */
export function parseLocalDate (value: string): Date | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!parts) {
    return null
  }

  const date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))

  return Number.isNaN(date.getTime()) ? null : date
}

export function isWeekend (value: string): boolean {
  const date = parseLocalDate(value)

  if (!date) {
    return false
  }

  const day = date.getDay()

  return day === 0 || day === 6
}

/** Only checked when capturing: an older permit stays correctable. */
export function hasEnoughNotice (startsOn: string, now: Date): boolean {
  const start = parseLocalDate(startsOn)

  if (!start) {
    return true
  }

  return start.getTime() - now.getTime() >= REQUIRED_NOTICE_HOURS * MS_PER_HOUR
}

export function endsBeforeStarts (startsOn: string, endsOn: string): boolean {
  const start = parseLocalDate(startsOn)
  const end = parseLocalDate(endsOn)

  if (!start || !end) {
    return false
  }

  return end.getTime() < start.getTime()
}

export interface LeavePermitDateErrors {
  ends_on?: string
  starts_on?: string
}

/**
 * A range that merely spans the weekend is accepted; only its first and last
 * day are checked.
 */
export function validateLeavePermitDates (
  startsOn: string,
  endsOn: string,
  options: { checkNotice?: boolean, now?: Date } = {},
): LeavePermitDateErrors {
  const errors: LeavePermitDateErrors = {}
  const now = options.now ?? new Date()

  if (startsOn && isWeekend(startsOn)) {
    errors.starts_on = LEAVE_PERMIT_MESSAGES.weekend
  } else if (startsOn && options.checkNotice !== false && !hasEnoughNotice(startsOn, now)) {
    errors.starts_on = LEAVE_PERMIT_MESSAGES.notice
  }

  if (endsOn && isWeekend(endsOn)) {
    errors.ends_on = LEAVE_PERMIT_MESSAGES.weekend
  } else if (startsOn && endsOn && endsBeforeStarts(startsOn, endsOn)) {
    errors.ends_on = LEAVE_PERMIT_MESSAGES.endsBeforeStarts
  }

  return errors
}
