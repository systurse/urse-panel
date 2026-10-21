/**
 * Local-date helpers for the agenda. Everything works on the browser's local
 * calendar (the API runs on America/Mexico_City): never `new Date('YYYY-MM-DD')`,
 * which JavaScript reads as UTC midnight and shows as the previous day here.
 */

export const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function pad (value: number): string {
  return String(value).padStart(2, '0')
}

/** `YYYY-MM-DD` of a Date in local time. */
export function toDateKey (date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** `HH:mm` of a Date in local time. */
export function toTimeKey (date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Local Date from `YYYY-MM-DD` and an optional `HH:mm`. */
export function parseLocal (dateKey: string, time = '00:00'): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0)
}

export function addDays (date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function addMinutes (date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

export function startOfDay (date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Monday-based week start. */
export function startOfWeek (date: Date): Date {
  const day = startOfDay(date)
  return addDays(day, -((day.getDay() + 6) % 7))
}

export function isSameDay (a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b)
}

/** "martes 10 de noviembre de 2026" */
export function formatLongDate (date: Date): string {
  return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** "10 nov 2026" */
export function formatShortDate (date: Date): string {
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatTime (date: Date): string {
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** "1 h 30 min" */
export function formatDuration (minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return [hours > 0 ? `${hours} h` : '', rest > 0 ? `${rest} min` : ''].filter(Boolean).join(' ') || '0 min'
}

/** Readable schedule of one occurrence; all-day events end at 00:00 of the next day. */
export function formatSchedule (startsAt: Date, endsAt: Date, allDay: boolean): string {
  if (allDay) {
    const lastDay = addDays(endsAt, -1)
    return isSameDay(startsAt, lastDay)
      ? `${formatLongDate(startsAt)} · todo el día`
      : `${formatShortDate(startsAt)} al ${formatShortDate(lastDay)} · todo el día`
  }

  return isSameDay(startsAt, endsAt)
    ? `${formatLongDate(startsAt)} · ${formatTime(startsAt)} – ${formatTime(endsAt)}`
    : `${formatShortDate(startsAt)} ${formatTime(startsAt)} – ${formatShortDate(endsAt)} ${formatTime(endsAt)}`
}

export function reminderLabel (minutes: number | null): string {
  if (minutes === null) {
    return 'Sin recordatorio'
  }
  if (minutes === 0) {
    return 'A la hora del evento'
  }
  if (minutes % 1440 === 0) {
    const days = minutes / 1440
    return `${days} ${days === 1 ? 'día' : 'días'} antes`
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60
    return `${hours} ${hours === 1 ? 'hora' : 'horas'} antes`
  }
  return `${minutes} minutos antes`
}
