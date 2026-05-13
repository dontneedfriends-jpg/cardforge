import { ColorGenerator, type ColorPalette } from './colorGenerator';

export type FrameOption = 'sharp' | 'rounded' | 'arched';
export type EdgeOption = 'straight' | 'ripped' | 'zigzag';

export interface DialogFrameOptions {
  width: number;
  height: number;
  backColor: string;
  frontColor: string;
  outlineColor: string;
  outlineWidth: number;
  frameOption: FrameOption;
  edgeOption: EdgeOption;
  frameWidth: number;
  turbulence: number;
  resketch: boolean;
  archDirection?: 'up' | 'down';
  palette?: ColorPalette;
}

function generateSkeletonPoints(frame: FrameOption, width: number, height: number, archDirection: 'up' | 'down' = 'up'): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const cornerRadius = Math.min(width, height) * 0.15;

  switch (frame) {
    case 'arched': {
      const archHeight = height * 0.3;
      const steps = 20;
      if (archDirection === 'up') {
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const curve = Math.sin(t * Math.PI) * archHeight;
          points.push({ x: t * width, y: archHeight - curve });
        }
        for (let i = steps; i >= 0; i--) {
          const t = i / steps;
          const curve = Math.sin(t * Math.PI) * archHeight;
          points.push({ x: t * width, y: height - curve });
        }
      } else {
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const curve = Math.sin(t * Math.PI) * archHeight;
          points.push({ x: t * width, y: curve });
        }
        for (let i = steps; i >= 0; i--) {
          const t = i / steps;
          const curve = Math.sin(t * Math.PI) * archHeight;
          points.push({ x: t * width, y: (height - archHeight) + curve });
        }
      }
      break;
    }
    case 'rounded': {
      const cr = cornerRadius;
      const w = width, h = height;
      points.push({ x: cr, y: 0 }, { x: w - cr, y: 0 });
      points.push({ x: (w - cr) + cr * Math.cos(-Math.PI / 3), y: cr + cr * Math.sin(-Math.PI / 3) });
      points.push({ x: (w - cr) + cr * Math.cos(-Math.PI / 6), y: cr + cr * Math.sin(-Math.PI / 6) });
      points.push({ x: w, y: cr }, { x: w, y: h - cr });
      points.push({ x: (w - cr) + cr * Math.cos(Math.PI / 6), y: (h - cr) + cr * Math.sin(Math.PI / 6) });
      points.push({ x: (w - cr) + cr * Math.cos(Math.PI / 3), y: (h - cr) + cr * Math.sin(Math.PI / 3) });
      points.push({ x: w - cr, y: h }, { x: cr, y: h });
      points.push({ x: cr + cr * Math.cos(Math.PI * 2 / 3), y: (h - cr) + cr * Math.sin(Math.PI * 2 / 3) });
      points.push({ x: cr + cr * Math.cos(Math.PI * 5 / 6), y: (h - cr) + cr * Math.sin(Math.PI * 5 / 6) });
      points.push({ x: 0, y: h - cr }, { x: 0, y: cr });
      points.push({ x: cr + cr * Math.cos(Math.PI * 7 / 6), y: cr + cr * Math.sin(Math.PI * 7 / 6) });
      points.push({ x: cr + cr * Math.cos(Math.PI * 4 / 3), y: cr + cr * Math.sin(Math.PI * 4 / 3) });
      break;
    }
    case 'sharp':
    default:
      points.push({ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height });
      break;
  }
  return points;
}

function applyEdgeStyle(skeleton: { x: number; y: number }[], edge: EdgeOption, turbulence: number): { x: number; y: number }[] {
  const finalPoints: { x: number; y: number }[] = [];
  if (turbulence === 0 && edge !== 'zigzag') return skeleton;

  skeleton.forEach((p1, i) => {
    finalPoints.push(p1);
    const p2 = skeleton[(i + 1) % skeleton.length];
    const seg = { x: p2.x - p1.x, y: p2.y - p1.y };
    const len = Math.sqrt(seg.x ** 2 + seg.y ** 2);
    if (len === 0) return;
    const perp = { x: -seg.y / len, y: seg.x / len };
    const subdivisions = edge === 'ripped' ? 10 : 5;
    for (let j = 1; j <= subdivisions; j++) {
      const t = j / (subdivisions + 1);
      const pt = { x: p1.x + seg.x * t, y: p1.y + seg.y * t };
      let displacedPt = { ...pt };
      switch (edge) {
        case 'ripped':
          if (Math.random() < 0.3) {
            const displacement = (Math.random() - 0.5) * len * 0.3 * turbulence;
            displacedPt = { x: pt.x + perp.x * displacement, y: pt.y + perp.y * displacement };
          }
          break;
        case 'zigzag': {
          const amplitude = len * 0.02;
          const zigOffset = (j % 2 === 0 ? 1 : -1) * amplitude * (1 - turbulence * 0.8);
          displacedPt = { x: pt.x + perp.x * zigOffset, y: pt.y + perp.y * zigOffset };
          break;
        }
        default: {
          const displacement = (Math.random() - 0.5) * len * 0.2 * turbulence;
          displacedPt = { x: pt.x + perp.x * displacement, y: pt.y + perp.y * displacement };
          break;
        }
      }
      finalPoints.push(displacedPt);
    }
  });
  return finalPoints;
}

function pointsToPathString(points: { x: number; y: number }[], edge: EdgeOption): string {
  if (points.length < 2) return 'M0,0Z';
  if (edge === 'ripped' || edge === 'zigzag') {
    let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x.toFixed(2)},${points[i].y.toFixed(2)}`;
    }
    return d + 'Z';
  }
  let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  const len = points.length;
  for (let i = 0; i < len; i++) {
    const p0 = points[(i - 1 + len) % len];
    const p1 = points[i];
    const p2 = points[(i + 1) % len];
    const p3 = points[(i + 2) % len];
    const cp1x = p1.x + (p2.x - p0.x) / 6, cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6, cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d + 'Z';
}

export function generateDialogFrame(options: DialogFrameOptions): string {
  const {
    width, height, backColor, frontColor, outlineColor, outlineWidth,
    frameOption, edgeOption, frameWidth, turbulence, resketch, archDirection = 'up'
  } = options;

  let frameElements = '';
  let resketchElements = '';

  let margin = 0;
  if (frameWidth > 0) {
    margin += frameWidth + (outlineWidth / 2);
  } else {
    margin += outlineWidth / 2;
  }
  const turbulenceBuffer = Math.max(width, height) * 0.05 * turbulence;
  margin += turbulenceBuffer;
  if (resketch) margin += (outlineWidth * 0.3) + 1;
  margin += 2;

  const canvas = { x: margin, y: margin, width: width - margin * 2, height: height - margin * 2 };
  if (canvas.width <= 0 || canvas.height <= 0) {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" />`;
  }
  const transform = `transform="translate(${canvas.x}, ${canvas.y})"`;

  const skeleton = generateSkeletonPoints(frameOption, canvas.width, canvas.height, archDirection);
  const styled = applyEdgeStyle(skeleton, edgeOption, turbulence);
  const pathData = pointsToPathString(styled, edgeOption);

  if (frameWidth <= 0) {
    frameElements = `<path d="${pathData}" fill="${backColor}" stroke="${outlineColor}" stroke-width="${outlineWidth}" />`;
  } else {
    const frameStrokeWidth = frameWidth * 2 + outlineWidth;
    const innerStrokeWidth = frameWidth * 2 - outlineWidth;
    frameElements = `<g fill="${backColor}">
      <path d="${pathData}" stroke="${outlineColor}" stroke-width="${frameStrokeWidth}" />
      <path d="${pathData}" stroke="${frontColor}" stroke-width="${innerStrokeWidth}" />
      <path d="${pathData}" />
    </g>`;
  }

  if (resketch) {
    const sketchTransform1 = `transform="translate(0.5, -0.5) rotate(0.1)"`;
    const sketchTransform2 = `transform="translate(-0.5, 0.5) rotate(-0.1)"`;
    const resketchStroke = `stroke="${outlineColor}" stroke-width="${outlineWidth * 0.6}" opacity="0.7" fill="none"`;
    resketchElements = `
      <g ${sketchTransform1}><path d="${pathData}" ${resketchStroke} /></g>
      <g ${sketchTransform2}><path d="${pathData}" ${resketchStroke} /></g>`;
  }

  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <g ${transform}>
    ${frameElements}
    ${resketchElements}
  </g>
</svg>`.trim();
}

export function generateRandomDialogFrame(baseOptions: Partial<DialogFrameOptions> = {}): string {
  const palette = baseOptions?.palette ?? ColorGenerator.generateHarmoniousPalette();
  const finalWidth = baseOptions.width ?? Math.floor(Math.random() * 200 + 200);
  const finalHeight = baseOptions.height ?? Math.floor(Math.random() * 150 + 100);
  const frameOptions: FrameOption[] = ['sharp', 'rounded', 'arched'];
  const edgeOptions: EdgeOption[] = ['straight', 'ripped', 'zigzag'];

  return generateDialogFrame({
    width: finalWidth, height: finalHeight,
    backColor: baseOptions?.backColor ?? palette.back,
    frontColor: baseOptions?.frontColor ?? palette.front,
    outlineColor: baseOptions?.outlineColor ?? palette.outline,
    outlineWidth: baseOptions?.outlineWidth ?? Math.random() * 2 + 1,
    frameOption: baseOptions?.frameOption ?? frameOptions[Math.floor(Math.random() * frameOptions.length)],
    edgeOption: baseOptions?.edgeOption ?? edgeOptions[Math.floor(Math.random() * edgeOptions.length)],
    frameWidth: baseOptions?.frameWidth ?? (Math.random() < 0.4 ? 0 : Math.random() * 20 + 5),
    turbulence: baseOptions?.turbulence ?? Math.random() * 0.8,
    resketch: baseOptions?.resketch ?? Math.random() < 0.5,
  });
}

export function generateRandomBanner(baseOptions: Partial<DialogFrameOptions> = {}): string {
  return generateRandomDialogFrame({
    width: 640, height: 120,
    outlineWidth: 4, turbulence: 0.1, frameOption: 'rounded', edgeOption: 'ripped', frameWidth: 0, resketch: true,
    palette: baseOptions.palette ?? ColorGenerator.generateHarmoniousPalette(),
    ...baseOptions,
  });
}

export function generateRandomTextbox(baseOptions: Partial<DialogFrameOptions> = {}): string {
  return generateRandomDialogFrame({
    width: 640, height: 320,
    outlineWidth: 4, turbulence: 0.1, frameOption: 'rounded', edgeOption: 'ripped', frameWidth: 0, resketch: true,
    palette: baseOptions.palette ?? ColorGenerator.generateHarmoniousPalette(),
    ...baseOptions,
  });
}
