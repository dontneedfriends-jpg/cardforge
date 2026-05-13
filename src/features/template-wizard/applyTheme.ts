import type { ColorPalette } from '../asset-generator/generators/colorGenerator';
import { generateCardBackground } from '../asset-generator/generators/cardBackgroundGenerator';
import type { CardTemplate } from '../../shared/templates/cardTemplates';

interface AppliedTheme {
  html: string;
  css: string;
  backgroundSvg: string;
}

function hslToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return hsl;
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function lighten(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function generateRichPalette(index: number): ColorPalette & { accent: string } {
  const themeHues = [210, 350, 45, 160];
  const hue = themeHues[index % themeHues.length] + (Math.random() * 30 - 15);
  const saturation = 25 + Math.random() * 15;
  const isLight = index >= 2;

  const bgLightness = isLight ? 92 + Math.random() * 6 : 12 + Math.random() * 8;
  const backLightness = isLight ? 85 + Math.random() * 8 : 18 + Math.random() * 6;
  const frontLightness = isLight ? 60 + Math.random() * 15 : 40 + Math.random() * 12;
  const outlineLightness = isLight ? 30 + Math.random() * 10 : 55 + Math.random() * 10;
  const colorLightness = isLight ? 20 + Math.random() * 8 : 80 + Math.random() * 10;

  return {
    hue,
    saturation,
    isLightOnDark: !isLight,
    front: `hsl(${hue.toFixed(0)}, ${(saturation + 20).toFixed(0)}%, ${frontLightness.toFixed(0)}%)`,
    back: `hsl(${hue.toFixed(0)}, ${(saturation - 5).toFixed(0)}%, ${backLightness.toFixed(0)}%)`,
    background: `hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${bgLightness.toFixed(0)}%)`,
    outline: `hsl(${hue.toFixed(0)}, ${(saturation + 10).toFixed(0)}%, ${outlineLightness.toFixed(0)}%)`,
    color: `hsl(${hue.toFixed(0)}, ${(saturation - 5).toFixed(0)}%, ${colorLightness.toFixed(0)}%)`,
    accent: `hsl(${((hue + 40) % 360).toFixed(0)}, ${(saturation + 25).toFixed(0)}%, ${(isLight ? 50 : 55).toFixed(0)}%)`,
  };
}

const iconPaths = [
  // sparkles
  'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
  // swords
  'M14.5 17.5 3 6l1-1 11.5 11.5M9.5 10.5l4.5 4.5M16.5 14.5 21 19l-2 2-4.5-4.5M7.5 4.5 3 4l.5 4.5M4.5 7.5 6 9l1.5-1.5M17.5 14.5 19 13l1.5 1.5M14.5 17.5 16 19l-1.5 1.5',
  // gem
  'M6 3h12l4 6-10 13L2 9ZM2 9h20M11 3 9 9l3 13M13 3l2 6-3 13',
  // wand
  'M15 4V2M15 16v-2M8 9h2M14 9h2M9.5 5.5l1 1M12 3v1M9.5 12.5l1-1M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h11M18 9h.01',
  // star
  'M12 2l1.5 5.2L19 6l-3.5 4.5L19 15l-5.5-1.2L12 19l-1.5-5.2L5 15l3.5-4.5L5 6l5.5 1.2Z',
  // heart
  'M19 14c1.5-1.5 2.5-3.2 2.5-5.5A4.5 4.5 0 0 0 17 4c-1.5 0-2.9.7-4 1.8C11.9 4.7 10.5 4 9 4a4.5 4.5 0 0 0-4.5 4.5c0 2.3 1 4 2.5 5.5L12 21Z',
  // shield
  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
  // flame
  'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5',
  // crown
  'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7ZM3 16v2h18v-2',
  // moon
  'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
];

function pickIconSvg(index: number, color: string): string {
  const path = iconPaths[index % iconPaths.length];
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
}

function generateThemeCss(palette: ColorPalette & { accent: string }, bgDataUri: string, cardWidthMm: number, _cardHeightMm: number): string {
  const hexFront = hslToHex(palette.front);
  const hexBack = hslToHex(palette.back);
  const isDark = palette.isLightOnDark;

  const textPrimary = isDark ? '#f0f0f0' : '#1a1a1a';
  const textSecondary = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  const overlayLight = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const overlayMedium = isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.06)';
  const borderLight = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)';
  const glowColor = hexToRgba(hexFront, 0.3);

  return `.card-root {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
}
.card-bg {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-image: url('${bgDataUri}');
  background-size: cover;
  background-position: center;
  z-index: 0;
  pointer-events: none;
}
.card {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: ${textPrimary};
  overflow: hidden;
  border-radius: ${cardWidthMm * 0.19}px;
  box-shadow: inset 0 0 40px ${shadowColor};
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${cardWidthMm * 0.19}px ${cardWidthMm * 0.25}px;
  background: ${overlayLight};
  border-bottom: 1px solid ${borderLight};
}
.card-name {
  font-weight: 700;
  font-size: ${cardWidthMm * 0.254}px;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 2px ${shadowColor};
}
.card-type {
  font-size: ${cardWidthMm * 0.175}px;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: ${hexFront};
}
.card-body {
  flex: 1;
  padding: ${cardWidthMm * 0.25}px;
  font-size: ${cardWidthMm * 0.206}px;
  line-height: 1.5;
  overflow: hidden;
}
.card-footer {
  padding: ${cardWidthMm * 0.16}px ${cardWidthMm * 0.25}px;
  background: ${overlayMedium};
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  border-top: 1px solid ${borderLight};
}
.card-cost {
  font-size: ${cardWidthMm * 0.286}px;
  font-weight: 700;
  color: ${hexFront};
  text-shadow: 0 0 8px ${glowColor};
  width: ${cardWidthMm * 0.44}px;
  height: ${cardWidthMm * 0.44}px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${overlayMedium};
  border-radius: 50%;
  border: 2px solid ${hexToRgba(hexFront, 0.4)};
}
.card-rarity {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  z-index: 2;
}
.card-rarity.common { background: linear-gradient(90deg, ${hexBack}, ${lighten(hexBack, 30)}); }
.card-rarity.uncommon { background: linear-gradient(90deg, #2e8b57, #3cb371); }
.card-rarity.rare { background: linear-gradient(90deg, #1e90ff, #00bfff); }
.card-rarity.epic { background: linear-gradient(90deg, #9932cc, #ba55d3); }
.card-rarity.legendary { background: linear-gradient(90deg, #ff8c00, #ffd700); }
.card-art {
  height: ${cardWidthMm * 1.9}px;
  overflow: hidden;
  margin: ${cardWidthMm * 0.13}px ${cardWidthMm * 0.19}px;
  border-radius: ${cardWidthMm * 0.13}px;
  border: 1px solid ${borderLight};
}
.card-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-abilities {
  flex: 1;
  padding: ${cardWidthMm * 0.16}px ${cardWidthMm * 0.25}px;
  font-size: ${cardWidthMm * 0.19}px;
  line-height: 1.5;
  overflow-y: auto;
  color: ${textSecondary};
}
.card-stats {
  display: flex;
  justify-content: space-around;
  padding: ${cardWidthMm * 0.13}px ${cardWidthMm * 0.16}px;
  background: ${overlayLight};
  border-top: 1px solid ${borderLight};
  margin-top: auto;
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.stat-label {
  font-size: ${cardWidthMm * 0.143}px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${textSecondary};
}
.stat-value {
  font-size: ${cardWidthMm * 0.254}px;
  font-weight: 800;
  color: ${hexFront};
  text-shadow: 0 0 6px ${glowColor};
}
.card-icon {
  position: absolute;
  bottom: ${cardWidthMm * 0.4}px;
  right: ${cardWidthMm * 0.3}px;
  width: ${cardWidthMm * 1.2}px;
  height: ${cardWidthMm * 1.2}px;
  z-index: 0;
  pointer-events: none;
  opacity: 0.12;
}
.card-icon svg {
  width: 100%;
  height: 100%;
}
p { margin: 0; }
img { max-width: 100%; }`;
}

export function applyThemeToTemplate(template: CardTemplate, palette: ColorPalette & { accent: string }, index: number): AppliedTheme {
  const cardWidth = 630;
  const cardHeight = 880;
  const { widthMm, heightMm } = template.cardSize;

  const backgroundSvg = generateCardBackground({
    width: cardWidth,
    height: cardHeight,
    colors: [palette.background, palette.back, palette.front],
    gradientType: index < 2 ? 'radial' : 'linear',
    textureType: (['grain', 'dots', 'none', 'clouds'] as const)[index % 4],
    textureOpacity: 0.1,
  });

  const bgDataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(backgroundSvg)))}`;
  const iconSvg = pickIconSvg(index, hslToHex(palette.front));
  const css = generateThemeCss(palette, bgDataUri, widthMm, heightMm);
  const html = `<div class="card-root">
  <div class="card-bg"></div>
  <div class="card-icon">${iconSvg}</div>
  ${template.html}
</div>`;

  return { html, css, backgroundSvg };
}
