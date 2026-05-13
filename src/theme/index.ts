export function mmToPx(mm: number, dpi: number = 96): number {
  return Math.round((mm / 25.4) * dpi);
}
