import { ColorGenerator } from './colorGenerator';

export type GradientType = 'linear' | 'radial';
export type TextureType = 'stripes' | 'dots' | 'grain' | 'clouds' | 'fibers' | 'marble' | 'voronoi' | 'none';

export interface CardBackgroundOptions {
  width?: number;
  height?: number;
  colors: string[];
  gradientType?: GradientType;
  gradientAngle?: number;
  textureType?: TextureType;
  textureOpacity?: number;
  textureScale?: number;
  textureColor?: string;
}

function hslToRgbFractional(hsl: string): [number, number, number] {
  return ColorGenerator.hslToRgb(hsl);
}

export function generateCardBackground(options: CardBackgroundOptions): string {
  const {
    width = 630, height = 880, colors,
    gradientType = 'radial', gradientAngle = 45,
    textureType = 'grain', textureOpacity = 0.15, textureScale = 1, textureColor = 'white',
  } = options;

  if (!colors || colors.length === 0) {
    throw new Error("The 'colors' array must contain at least one color.");
  }

  const uniqueId = `card-bg-${Math.random().toString(36).substr(2, 9)}`;
  const defs: string[] = [];
  let textureFill = '';

  const gradientId = `${uniqueId}-gradient`;
  if (gradientType === 'linear') {
    const angleRad = (gradientAngle % 360) * (Math.PI / 180);
    const x1 = Math.round(50 + Math.sin(angleRad + Math.PI) * 50) + '%';
    const y1 = Math.round(50 + Math.cos(angleRad) * 50) + '%';
    const x2 = Math.round(50 + Math.sin(angleRad) * 50) + '%';
    const y2 = Math.round(50 + Math.cos(angleRad + Math.PI) * 50) + '%';
    defs.push(`<linearGradient id="${gradientId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      ${colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}" />`).join('')}
    </linearGradient>`);
  } else {
    defs.push(`<radialGradient id="${gradientId}">
      ${colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}" />`).join('')}
    </radialGradient>`);
  }

  const [r, g, b] = hslToRgbFractional(textureColor);
  const textureId = `${uniqueId}-texture`;

  switch (textureType) {
    case 'stripes': {
      const sw = 10 * textureScale;
      defs.push(`<pattern id="${textureId}" patternUnits="userSpaceOnUse" width="${sw}" height="${sw}" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="${sw}" stroke="white" stroke-width="${sw / 2}"/>
      </pattern>`);
      textureFill = `<rect width="${width}" height="${height}" fill="url(#${textureId})" opacity="${textureOpacity}" />`;
      break;
    }
    case 'dots': {
      const ds = 15 * textureScale;
      const dr = 1.5 * textureScale;
      defs.push(`<pattern id="${textureId}" patternUnits="userSpaceOnUse" width="${ds}" height="${ds}">
        <circle cx="${ds / 2}" cy="${ds / 2}" r="${dr}" fill="white" />
      </pattern>`);
      textureFill = `<rect width="${width}" height="${height}" fill="url(#${textureId})" opacity="${textureOpacity}" />`;
      break;
    }
    case 'grain':
      defs.push(`<filter id="${textureId}">
        <feTurbulence type="fractalNoise" baseFrequency="${0.7 / textureScale}" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix values="0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 1 0" />
      </filter>`);
      textureFill = `<rect width="${width}" height="${height}" filter="url(#${textureId})" opacity="${textureOpacity}" style="mix-blend-mode: multiply;" />`;
      break;
    case 'clouds': {
      const cfx = (0.02 / textureScale).toFixed(4);
      const cfy = (0.02 / textureScale).toFixed(4);
      defs.push(`<filter id="${textureId}">
        <feTurbulence type="fractalNoise" baseFrequency="${cfx} ${cfy}" numOctaves="3" stitchTiles="stitch" result="noise"/>
        <feColorMatrix type="matrix" in="noise" values="0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 0.5 0" />
      </filter>`);
      textureFill = `<rect width="100%" height="100%" filter="url(#${textureId})" opacity="${textureOpacity * 2}" />`;
      break;
    }
    case 'fibers': {
      const ffx = (0.01 / textureScale).toFixed(4);
      const ffy = (0.2 / textureScale).toFixed(4);
      defs.push(`<filter id="${textureId}">
        <feTurbulence type="fractalNoise" baseFrequency="${ffx} ${ffy}" numOctaves="3" stitchTiles="stitch" result="noise"/>
        <feColorMatrix type="matrix" in="noise" values="0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 0.5 0" />
      </filter>`);
      textureFill = `<rect width="100%" height="100%" filter="url(#${textureId})" opacity="${textureOpacity * 2}" />`;
      break;
    }
    case 'marble':
      defs.push(`<filter id="${textureId}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="${(0.03 / textureScale).toFixed(4)}" numOctaves="5" seed="5" result="noise"/>
        <feSpecularLighting surfaceScale="1" specularConstant="0.5" specularExponent="15" lighting-color="${textureColor}" in="noise" result="specular">
          <feDistantLight azimuth="235" elevation="60" />
        </feSpecularLighting>
        <feComposite in="specular" in2="SourceAlpha" operator="in" result="clip"/>
        <feComponentTransfer in="clip" result="transfer">
          <feFuncA type="linear" slope="${textureOpacity * 10}"/>
        </feComponentTransfer>
      </filter>`);
      textureFill = `<rect width="${width}" height="${height}" fill="white" filter="url(#${textureId})" />`;
      break;
    case 'voronoi':
      defs.push(`<filter id="${textureId}" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="${(0.015 / textureScale).toFixed(4)}" numOctaves="1" result="noise" />
        <feComponentTransfer in="noise" result="cells">
          <feFuncR type="discrete" tableValues="0.1 0.3 0.5 0.7 0.9" />
          <feFuncG type="discrete" tableValues="0.1 0.3 0.5 0.7 0.9" />
          <feFuncB type="discrete" tableValues="0.1 0.3 0.5 0.7 0.9" />
        </feComponentTransfer>
        <feBlend mode="hard-light" in="SourceGraphic" in2="cells" />
      </filter>`);
      break;
  }

  const mainRectFilter = textureType === 'voronoi' ? `filter="url(#${textureId})"` : '';

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs.join('\n    ')}</defs>
  <rect width="${width}" height="${height}" fill="url(#${gradientId})" ${mainRectFilter}/>
  ${textureFill}
</svg>`.trim();
}

function randomColors(): string[] {
  const numColors = Math.floor(Math.random() * 3) + 2;
  const colors: string[] = [];
  const baseHue = Math.random() * 360;
  const baseSaturation = Math.random() * 30 + 70;
  const baseLightness = Math.random() * 30 + 25;
  for (let i = 0; i < numColors; i++) {
    const hue = (baseHue + i * (Math.random() * 40 - 20)) % 360;
    const saturation = Math.max(0, Math.min(100, baseSaturation + Math.random() * 20 - 10));
    const lightness = Math.max(0, Math.min(100, baseLightness + Math.random() * 20 - 10));
    colors.push(`hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${lightness.toFixed(0)}%)`);
  }
  return colors.sort((a, b) => {
    const la = Number(a.match(/,\s*(\d+)%\)/)![1]);
    const lb = Number(b.match(/,\s*(\d+)%\)/)![1]);
    return la - lb;
  });
}

function generateTextureColor(palette: string[]): string {
  const lightestColor = palette[palette.length - 1];
  const match = lightestColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (match) {
    const [, h, s, l] = match;
    const newL = Math.min(100, parseInt(l, 10) + 30);
    return `hsl(${h}, ${s}%, ${newL}%)`;
  }
  return 'white';
}

export function generateRandomCardBackground(baseOptions: Partial<CardBackgroundOptions> = {}): string {
  const generatedColors = randomColors();
  const textureTypes: TextureType[] = ['stripes', 'dots', 'grain', 'clouds', 'fibers', 'marble', 'voronoi'];
  const gradientTypes: GradientType[] = ['linear', 'radial'];
  const randomGradientType = gradientTypes[Math.floor(Math.random() * gradientTypes.length)];
  const randomTextureType = textureTypes[Math.floor(Math.random() * textureTypes.length)];
  const randomGradientAngle = Math.floor(Math.random() * 360);
  const randomTextureOpacity = parseFloat((Math.random() * 0.12 + 0.11).toFixed(3));
  const randomTextureScale = parseFloat((Math.random() * 1.8 + 0.7).toFixed(2));

  return generateCardBackground({
    width: baseOptions.width, height: baseOptions.height,
    colors: generatedColors,
    gradientType: randomGradientType,
    gradientAngle: randomGradientAngle,
    textureType: randomTextureType,
    textureOpacity: randomTextureOpacity,
    textureScale: randomTextureScale,
    textureColor: generateTextureColor(generatedColors),
  });
}
