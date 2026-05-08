export function mmToPx(mm: number, dpi: number = 96): number {
  return (mm * dpi) / 25.4;
}
