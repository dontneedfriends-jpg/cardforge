import { ColorGenerator, type ColorPalette } from './colorGenerator';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function generateRandomBlobPath(width: number, height: number, complexity: number): string {
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < complexity; i++) {
    points.push({ x: Math.random() * width, y: Math.random() * height });
  }

  const bbox = points.reduce(
    (acc, p) => ({
      minX: Math.min(acc.minX, p.x), maxX: Math.max(acc.maxX, p.x),
      minY: Math.min(acc.minY, p.y), maxY: Math.max(acc.maxY, p.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );

  const shapeWidth = bbox.maxX - bbox.minX;
  const shapeHeight = bbox.maxY - bbox.minY;

  if (shapeWidth === 0 || shapeHeight === 0) {
    const pad = Math.min(width, height) * 0.1;
    return `M${pad},${pad} L${width - pad},${pad} L${width - pad},${height - pad} L${pad},${height - pad}Z`;
  }

  const padding = Math.min(width, height) * 0.1;
  const targetWidth = width - padding * 2;
  const targetHeight = height - padding * 2;
  const scale = Math.min(targetWidth / shapeWidth, targetHeight / shapeHeight);

  const transformed = points.map(p => {
    const nx = (p.x - bbox.minX) * scale;
    const ny = (p.y - bbox.minY) * scale;
    const finalW = shapeWidth * scale;
    const finalH = shapeHeight * scale;
    return { x: nx + (width - finalW) / 2, y: ny + (height - finalH) / 2 };
  });

  const centroid = transformed.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 }
  );
  centroid.x /= complexity;
  centroid.y /= complexity;

  transformed.sort((a, b) => {
    return Math.atan2(a.y - centroid.y, a.x - centroid.x) - Math.atan2(b.y - centroid.y, b.x - centroid.x);
  });

  let d = `M${transformed[0].x.toFixed(2)},${transformed[0].y.toFixed(2)}`;
  for (let i = 0; i < complexity; i++) {
    const p0 = transformed[(i - 1 + complexity) % complexity];
    const p1 = transformed[i];
    const p2 = transformed[(i + 1) % complexity];
    const p3 = transformed[(i + 2) % complexity];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${clamp(cp1x, 0, width).toFixed(2)},${clamp(cp1y, 0, height).toFixed(2)} ${clamp(cp2x, 0, width).toFixed(2)},${clamp(cp2y, 0, height).toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d + 'Z';
}

function generateGeometricPath(
  width: number, height: number, numPoints: number,
  turbulence: number, isStar: boolean = false, starInnerScale: number = 0.5
): string {
  const pts = Math.max(3, numPoints);
  const cx = width / 2, cy = height / 2;
  const outerR = Math.min(width, height) / 2;
  const innerR = outerR * starInnerScale;
  const angleStep = (Math.PI * 2) / (isStar ? pts * 2 : pts);
  const totalVerts = isStar ? pts * 2 : pts;

  const basePoints: { x: number; y: number }[] = [];
  for (let i = 0; i < totalVerts; i++) {
    const r = isStar ? (i % 2 === 0 ? outerR : innerR) : outerR;
    const angle = i * angleStep - Math.PI / 2;
    basePoints.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }

  let finalPoints: { x: number; y: number }[] = [];
  if (turbulence <= 0) {
    finalPoints = basePoints;
  } else {
    const subdivisions = 3;
    basePoints.forEach((p1, i) => {
      const p2 = basePoints[(i + 1) % basePoints.length];
      finalPoints.push(p1);
      const seg = { x: p2.x - p1.x, y: p2.y - p1.y };
      const segLen = Math.sqrt(seg.x ** 2 + seg.y ** 2);
      const perp = { x: -seg.y, y: seg.x };
      for (let j = 1; j <= subdivisions; j++) {
        const t = j / (subdivisions + 1);
        const onEdge = { x: p1.x + seg.x * t, y: p1.y + seg.y * t };
        const displacement = (Math.random() - 0.5) * segLen * turbulence * 0.5;
        finalPoints.push({
          x: onEdge.x + perp.x / segLen * displacement,
          y: onEdge.y + perp.y / segLen * displacement,
        });
      }
    });
  }

  const bbox = finalPoints.reduce(
    (acc, p) => ({
      minX: Math.min(acc.minX, p.x), maxX: Math.max(acc.maxX, p.x),
      minY: Math.min(acc.minY, p.y), maxY: Math.max(acc.maxY, p.y),
    }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );
  const sw = bbox.maxX - bbox.minX, sh = bbox.maxY - bbox.minY;
  if (sw === 0 || sh === 0) return 'M0 0Z';
  const pad = Math.min(width, height) * 0.05;
  const scale = Math.min((width - pad * 2) / sw, (height - pad * 2) / sh);
  const centered = finalPoints.map(p => ({
    x: (p.x - bbox.minX) * scale + (width - sw * scale) / 2,
    y: (p.y - bbox.minY) * scale + (height - sh * scale) / 2,
  }));

  if (turbulence <= 0) {
    let d = `M ${centered[0].x.toFixed(2)},${centered[0].y.toFixed(2)}`;
    for (let i = 1; i < centered.length; i++) d += ` L ${centered[i].x.toFixed(2)},${centered[i].y.toFixed(2)}`;
    return d + 'Z';
  } else {
    let d = `M ${centered[0].x.toFixed(2)},${centered[0].y.toFixed(2)}`;
    const len = centered.length;
    for (let i = 0; i < len; i++) {
      const p0 = centered[(i - 1 + len) % len];
      const p1 = centered[i];
      const p2 = centered[(i + 1) % len];
      const p3 = centered[(i + 2) % len];
      const cp1x = p1.x + (p2.x - p0.x) / 6, cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6, cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }
    return d;
  }
}

export type MirrorOption = 'vertical' | 'horizontal' | 'both' | 'none';
export type ShapeOption = 'blob' | 'star' | 'convex' | 'none';
export type BackgroundOption = 'solid' | 'none';

export interface ShapeOptions {
  type?: ShapeOption;
  fillColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  mirror?: MirrorOption;
  scale?: number;
  starInnerScale?: number;
  numPoints?: number;
  turbulence?: number;
}

export interface CardSymbolOptions {
  width?: number;
  height?: number;
  frontShape?: ShapeOptions;
  backShape?: ShapeOptions;
  backgroundType?: BackgroundOption;
  backgroundColor?: string;
  palette?: ColorPalette;
}

export function generateCardSymbol(options?: CardSymbolOptions): string {
  const {
    width = 100, height = 100,
    frontShape = { scale: 0.7, type: 'blob', fillColor: 'white', starInnerScale: 0.8, outlineColor: '#333', mirror: 'none', outlineWidth: 2 },
    backShape = { scale: 1.0, type: 'blob', fillColor: 'grey', starInnerScale: 0.8, outlineColor: '#333', mirror: 'none', outlineWidth: 2 },
    backgroundType, backgroundColor,
  } = options || {};

  let useElements = '';
  let symbolDef = '';

  [backShape, frontShape].forEach((shape) => {
    const outlineStroke = shape.outlineWidth && shape.outlineWidth > 0
      ? `stroke="${shape.outlineColor}" stroke-width="${shape.outlineWidth}"` : '';
    const scale = shape.scale || 1.0;
    const tx = (width - width * scale) / 2;
    const ty = (height - height * scale) / 2;

    let pathData = '';
    let element = '';
    switch (shape.type) {
      case 'blob':
        pathData = generateRandomBlobPath(width * scale, height * scale, 5);
        element = `<path d="${pathData}" fill="${shape.fillColor}" ${outlineStroke} transform="translate(${tx}, ${ty})" />`;
        break;
      case 'star':
        pathData = generateGeometricPath(width * scale, height * scale, shape.numPoints || 6, shape.turbulence || 0, true, 0.8);
        element = `<path d="${pathData}" fill="${shape.fillColor}" ${outlineStroke} transform="translate(${tx}, ${ty})" />`;
        break;
      case 'convex':
        pathData = generateGeometricPath(width * scale, height * scale, shape.numPoints || 6, shape.turbulence || 0, false);
        element = `<path d="${pathData}" fill="${shape.fillColor}" ${outlineStroke} transform="translate(${tx}, ${ty})" />`;
        break;
    }

    const uniqueId = `symbol-${Math.random().toString(36).substr(2, 9)}`;
    const symbolId = `${uniqueId}-pattern`;
    symbolDef += `<symbol id="${symbolId}" viewBox="0 0 ${width} ${height}">${element}</symbol>`;

    switch (shape.mirror) {
      case 'both':
        useElements += `<use href="#${symbolId}" x="0" y="0" width="${width}" height="${height}" />
          <use href="#${symbolId}" x="0" y="0" width="${width}" height="${height}" transform="translate(${width}, 0) scale(-1, 1)" />
          <use href="#${symbolId}" x="0" y="0" width="${width}" height="${height}" transform="translate(0, ${height}) scale(1, -1)" />
          <use href="#${symbolId}" x="0" y="0" width="${width}" height="${height}" transform="translate(${width}, ${height}) scale(-1, -1)" />`;
        break;
      case 'horizontal':
        useElements += `<use href="#${symbolId}" x="0" y="0" width="${width}" height="${height}" />
          <use href="#${symbolId}" x="0" y="0" width="${width}" height="${height}" transform="translate(${width}, 0) scale(-1, 1)" />`;
        break;
      case 'vertical':
        useElements += `<use href="#${symbolId}" x="0" y="0" width="${width}" height="${height}" />
          <use href="#${symbolId}" x="0" y="0" width="${width}" height="${height}" transform="translate(0, ${height}) scale(1, -1)" />`;
        break;
      default:
        useElements += `<use href="#${symbolId}" x="0" y="0" width="${width}" height="${height}" />`;
        break;
    }
  });

  let backgroundRect = '';
  if (backgroundType === 'solid') {
    backgroundRect = `<rect width="${width}" height="${height}" fill="${backgroundColor}" />`;
  }

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>${symbolDef}</defs>
  ${backgroundRect}
  ${useElements}
</svg>`.trim();
}

export function generateRandomCardSymbol(baseOptions: Partial<CardSymbolOptions> = {}): string {
  const palette = baseOptions?.palette ?? ColorGenerator.generateHarmoniousPalette();
  const randomOutlineColor = palette.outline;
  const mirrorOptions: MirrorOption[] = ['vertical', 'horizontal', 'both'];
  const randomMirror = mirrorOptions[Math.floor(Math.random() * mirrorOptions.length)];
  const symbolWidth = baseOptions.width || 100;
  const maxOutline = Math.max(2, symbolWidth * 0.05);
  const randomOutlineWidth = Math.random() * (maxOutline - 1) + 1;
  const foregroundNumPoints = Math.floor(Math.random() * 9) + 3;
  const backgroundNumPoints = Math.floor(Math.random() * 9) + 3;
  const shapeOptions: ShapeOption[] = ['blob', 'star', 'convex'];
  const frontShapeType = shapeOptions[Math.floor(Math.random() * shapeOptions.length)];
  const backShapeType = shapeOptions[Math.floor(Math.random() * shapeOptions.length)];
  const backgroundColor = palette.background;

  return generateCardSymbol({
    ...baseOptions,
    frontShape: {
      type: baseOptions?.frontShape?.type ?? frontShapeType,
      fillColor: baseOptions?.frontShape?.fillColor ?? palette.front,
      outlineColor: baseOptions?.frontShape?.outlineColor ?? randomOutlineColor,
      outlineWidth: baseOptions?.frontShape?.outlineWidth ?? randomOutlineWidth,
      mirror: baseOptions?.frontShape?.mirror ?? randomMirror,
      numPoints: baseOptions?.frontShape?.numPoints ?? foregroundNumPoints,
      turbulence: baseOptions?.frontShape?.turbulence ?? 0.2,
      scale: baseOptions?.frontShape?.scale ?? 0.7,
    },
    backShape: {
      type: baseOptions?.backShape?.type ?? backShapeType,
      fillColor: baseOptions?.backShape?.fillColor ?? palette.back,
      outlineColor: baseOptions?.backShape?.outlineColor ?? randomOutlineColor,
      outlineWidth: baseOptions?.backShape?.outlineWidth ?? randomOutlineWidth,
      mirror: baseOptions?.backShape?.mirror ?? randomMirror,
      numPoints: baseOptions?.backShape?.numPoints ?? backgroundNumPoints,
      turbulence: baseOptions?.backShape?.turbulence ?? 0.2,
    },
    backgroundType: baseOptions?.backgroundType ?? 'none',
    backgroundColor: baseOptions?.backgroundColor ?? backgroundColor,
    palette,
  });
}

export function generateRandomArt(palette: ColorPalette): string {
  return generateRandomCardSymbol({
    width: 640, height: 480,
    frontShape: { type: 'blob', outlineWidth: 2 },
    backShape: { outlineWidth: 2 },
    backgroundType: 'solid',
    palette,
  });
}

export function generateRandomBadge(palette: ColorPalette): string {
  return generateRandomCardSymbol({
    width: 64, height: 64,
    frontShape: { type: 'convex', outlineWidth: 2, mirror: 'none' },
    backShape: { outlineWidth: 2 },
    palette,
  });
}

export function generateRandomSymbol(palette: ColorPalette): string {
  return generateRandomCardSymbol({
    width: 64, height: 64,
    frontShape: { type: 'blob', outlineWidth: 2 },
    backShape: { outlineWidth: 2 },
    palette,
  });
}
