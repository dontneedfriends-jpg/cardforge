export function getPatternCss(pattern: string, color: string, opacity: number): string {
  const c = color.replace(/[\d.]+\)$/, `${opacity})`);
  switch (pattern) {
    case 'stripes':
      return `repeating-linear-gradient(45deg, transparent, transparent 10px, ${c} 10px, ${c} 11px)`;
    case 'dots':
      return `radial-gradient(${c} 1px, transparent 1px) 0 0 / 20px 20px`;
    case 'crosshatch':
      return [
        `repeating-linear-gradient(45deg, transparent, transparent 8px, ${c} 8px, ${c} 9px)`,
        `repeating-linear-gradient(-45deg, transparent, transparent 8px, ${c} 8px, ${c} 9px)`,
      ].join(', ');
    default:
      return 'none';
  }
}
