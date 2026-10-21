/**
 * One stable colour per area, so the same school always looks the same in
 * every view. Picked to read well with white text on light and dark themes.
 */
const AREA_PALETTE = [
  '#8a5a00',
  '#1565c0',
  '#2e7d32',
  '#6a1b9a',
  '#c62828',
  '#00838f',
  '#ef6c00',
  '#4527a0',
  '#ad1457',
  '#37474f',
  '#558b2f',
  '#5d4037',
]

export function areaColor (areaId: number | null | undefined): string {
  if (!areaId) {
    return AREA_PALETTE.at(-3) as string
  }
  return AREA_PALETTE[areaId % AREA_PALETTE.length] as string
}
