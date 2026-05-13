export interface ColorPalette {
  hue: number;
  saturation: number;
  isLightOnDark: boolean;
  front: string;
  back: string;
  background: string;
  outline: string;
  color: string;
}

export class ColorGenerator {
  static generateHarmoniousPalette(preset: Partial<ColorPalette> = {}): ColorPalette {
    const hue = preset.hue ?? Math.random() * 360;
    const saturation = preset.saturation ?? Math.random() * 20 + 30;
    const isLightOnDark = preset.isLightOnDark ?? (Math.random() < 0.5);

    const frontLightness = Math.random() * 15 + 70;
    const backLightness = Math.random() * 15 + 55;
    const backgroundLightness = Math.random() * 15 + 40;
    const outlineLightness = Math.random() * 15 + 10;
    const colorLightness = outlineLightness;

    return {
      hue,
      saturation,
      isLightOnDark,
      front: preset.front ?? `hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${frontLightness.toFixed(0)}%)`,
      back: preset.back ?? `hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${backLightness.toFixed(0)}%)`,
      background: preset.background ?? `hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${backgroundLightness.toFixed(0)}%)`,
      outline: preset.outline ?? `hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${outlineLightness.toFixed(0)}%)`,
      color: preset.color ?? `hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${colorLightness.toFixed(0)}%)`,
    };
  }

  static hslToRgb(hsl: string): [number, number, number] {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return [0.5, 0.5, 0.5];
    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return [f(0), f(8), f(4)];
  }
}
