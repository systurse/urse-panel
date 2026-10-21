/**
 * Saves a Blob the API returned (export, attachment, .ics) with the given
 * name. The URL is revoked later, not right away: some browsers start the
 * download asynchronously.
 */
export function downloadBlob (blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
