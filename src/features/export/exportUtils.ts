import { toPng } from 'html-to-image';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { CardSize, CardBackDesign } from '../../shared/types/project';
import { injectFontCss } from '../../shared/utils/fontUtils';

export interface ExportOptions {
  dpi: number;
  bleed: number;
  pageSize: 'A4' | 'Letter';
  cropMarks: boolean;
}

const PAGE_DIMS: Record<string, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  Letter: { w: 215.9, h: 279.4 },
};

function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

export async function generatePrintHtml(
  cardBodies: { body: string; css: string }[],
  cardSize: CardSize,
  options: ExportOptions,
  projectPath?: string
): Promise<string> {
  let cssWithFonts = cardBodies.map(c => c.css);
  if (projectPath) {
    const fontCss = await injectFontCss(cardBodies[0]?.css || '', projectPath);
    if (fontCss) {
      cssWithFonts = cardBodies.map(() => fontCss);
    }
  }
  const page = PAGE_DIMS[options.pageSize];

  const gap = 3;

  const cropMarkCss = options.cropMarks ? `
  .crop-container { position: relative; }
  .crop-mark {
    position: absolute;
    background: #000;
    z-index: 10;
  }
  .crop-tl { top: -${options.bleed + 2}mm; left: -${options.bleed + 2}mm; width: 12px; height: 1px; }
  .crop-tl2 { top: -${options.bleed + 2}mm; left: -${options.bleed + 2}mm; width: 1px; height: 12px; }
  .crop-tr { top: -${options.bleed + 2}mm; right: -${options.bleed + 2}mm; width: 12px; height: 1px; }
  .crop-tr2 { top: -${options.bleed + 2}mm; right: -${options.bleed + 2}mm; width: 1px; height: 12px; }
  .crop-bl { bottom: -${options.bleed + 2}mm; left: -${options.bleed + 2}mm; width: 12px; height: 1px; }
  .crop-bl2 { bottom: -${options.bleed + 2}mm; left: -${options.bleed + 2}mm; width: 1px; height: 12px; }
  .crop-br { bottom: -${options.bleed + 2}mm; right: -${options.bleed + 2}mm; width: 12px; height: 1px; }
  .crop-br2 { bottom: -${options.bleed + 2}mm; right: -${options.bleed + 2}mm; width: 1px; height: 12px; }
  ` : '';

  return `<!DOCTYPE html>
<html><head><style>
  @page { size: ${options.pageSize}; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    display: flex;
    flex-wrap: wrap;
    gap: ${gap}mm;
    padding: ${options.bleed}mm;
    width: ${page.w}mm;
    height: ${page.h}mm;
  }
  .card-wrap {
    width: ${cardSize.widthMm}mm;
    height: ${cardSize.heightMm}mm;
    overflow: hidden;
    position: relative;
    background: white;
  }
  .card-wrap img { max-width: 100%; display: block; }
  ${cropMarkCss}
  ${cssWithFonts.join('\n')}
</style></head><body>
${cardBodies.map((c) => {
  const marks = options.cropMarks ? `
    <div class="crop-mark crop-tl"></div><div class="crop-mark crop-tl2"></div>
    <div class="crop-mark crop-tr"></div><div class="crop-mark crop-tr2"></div>
    <div class="crop-mark crop-bl"></div><div class="crop-mark crop-bl2"></div>
    <div class="crop-mark crop-br"></div><div class="crop-mark crop-br2"></div>` : '';
  return `<div class="card-wrap crop-container">${marks}${c.body}</div>`;
}).join('\n')}
</body></html>`;
}

let hiddenContainer: HTMLDivElement | null = null;

function getHiddenContainer(): HTMLDivElement {
  if (!hiddenContainer) {
    hiddenContainer = document.createElement('div');
    hiddenContainer.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1';
    document.body.appendChild(hiddenContainer);
  }
  return hiddenContainer;
}

export async function captureCardAsPng(
  html: string,
  css: string,
  cardWidthMm: number,
  cardHeightMm: number,
  dpi: number
): Promise<Uint8Array> {
  const w = mmToPx(cardWidthMm, dpi);
  const h = mmToPx(cardHeightMm, dpi);

  const container = getHiddenContainer();
  const div = document.createElement('div');
  div.style.cssText = `width:${w}px;height:${h}px;overflow:hidden;`;
  div.innerHTML = `<style>${css}</style>${html}`;
  container.appendChild(div);

  const savedLinks: { el: HTMLLinkElement; next: Node | null }[] = [];
  const head = document.head;
  const links = head.querySelectorAll('link[rel="stylesheet"][href*="://"]');
  links.forEach((el) => {
    savedLinks.push({ el: el as HTMLLinkElement, next: el.nextSibling });
    head.removeChild(el);
  });

  try {
    const dataUrl = await toPng(div, { width: w, height: h, pixelRatio: 1 });
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } finally {
    savedLinks.forEach(({ el, next }) => {
      if (next && next.parentNode) {
        head.insertBefore(el, next);
      } else {
        head.appendChild(el);
      }
    });
    container.removeChild(div);
  }
}

export interface ProgressCallback {
  onProgress?: (current: number, total: number) => void;
  onStatus?: (status: string) => void;
  cancelled?: boolean;
}

export async function exportAllCardsAsPng(
  deckName: string,
  cardBodies: { body: string; css: string }[],
  cardSize: CardSize,
  dpi: number,
  projectPath: string,
  pc?: ProgressCallback
): Promise<void> {
  const dir = await open({
    title: 'Export PNGs — select output folder',
    directory: true,
    defaultPath: `${projectPath}/${deckName}_png`,
  });
  if (!dir) return;
  if (pc?.onStatus) pc.onStatus('Rendering cards...');

  const names: string[] = [];
  const images: Uint8Array[] = [];
  const fontCss = await injectFontCss(cardBodies[0]?.css || '', projectPath);

  for (let i = 0; i < cardBodies.length; i++) {
    if (pc?.cancelled) return;
    if (pc?.onProgress) pc.onProgress(i + 1, cardBodies.length);
    if (pc?.onStatus) pc.onStatus(`Rendering card ${i + 1} of ${cardBodies.length}...`);
    const bytes = await captureCardAsPng(
      cardBodies[i].body,
      fontCss || cardBodies[i].css,
      cardSize.widthMm,
      cardSize.heightMm,
      dpi
    );
    names.push(`card_${i + 1}.png`);
    images.push(bytes);
  }

  if (pc?.onStatus) pc.onStatus('Saving images to disk...');
  await invoke('export_png_batch', { outputDir: dir, images: images.map(b => Array.from(b)), names });
}

function getPatternCss(pattern: string, color: string, opacity: number): string {
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

export function renderCardBackBody(
  design: CardBackDesign,
  cardWidthMm: number,
  cardHeightMm: number,
  dpi: number
): { body: string; css: string } {
  const w = mmToPx(cardWidthMm, dpi);
  const h = mmToPx(cardHeightMm, dpi);
  const patternCss = getPatternCss(design.pattern, design.patternColor, design.patternOpacity);

  const body = `
    <div style="
      width:100%;height:100%;
      background:linear-gradient(${design.gradientAngle}deg,${design.backgroundTop} 0%,${design.backgroundMid} 50%,${design.backgroundBottom} 100%);
      display:flex;align-items:center;justify-content:center;
      position:relative;overflow:hidden;
    ">
      ${design.textureUrl ? `<div style="position:absolute;inset:0;background-image:url(${design.textureUrl});background-size:cover;background-position:center;opacity:${design.textureOpacity};"></div>` : ''}
      <div style="position:absolute;inset:0;background:${patternCss};"></div>
      ${design.symbol2 ? `<div style="position:absolute;top:12%;right:12%;font-size:${design.symbol2Size}px;color:${design.symbol2Color};font-weight:700;font-family:serif;z-index:2;">${design.symbol2}</div>` : ''}
      <div style="
        width:70%;height:70%;border-radius:50%;
        border:${design.borderWidth}px solid ${design.borderColor};
        display:flex;align-items:center;justify-content:center;
        background:radial-gradient(circle at center, ${design.backgroundMid}66 0%, transparent 70%);
        position:relative;z-index:1;
      ">
        <span style="font-size:${design.symbolSize}px;font-weight:700;color:${design.symbolColor};font-family:serif;text-shadow:0 0 20px ${design.backgroundBottom}80;">
          ${design.symbol || '?'}
        </span>
      </div>
    </div>`;

  const css = `
    * { box-sizing:border-box; margin:0; padding:0; }
    html,body { width:${w}px; height:${h}px; overflow:hidden; }
  `;

  return { body, css };
}

export async function captureCardBackAsPng(
  design: CardBackDesign,
  cardWidthMm: number,
  cardHeightMm: number,
  dpi: number
): Promise<Uint8Array> {
  const { body, css } = renderCardBackBody(design, cardWidthMm, cardHeightMm, dpi);
  return captureCardAsPng(body, css, cardWidthMm, cardHeightMm, dpi);
}

export function generateTtsJson(
  deckName: string,
  cardNames: string[],
  spritesheetPath: string,
  backPath: string,
  numWidth: number,
  numHeight: number
): string {
  const toFileUrl = (p: string) => `file:///${p.replace(/\\/g, '/')}`;
  const obj = {
    SaveName: '',
    Date: new Date().toISOString().split('T')[0],
    VersionNumber: 1,
    GameMode: '',
    GameType: '',
    GameComplexity: '',
    Tags: [] as string[],
    Gravity: 0.5,
    PlayArea: 0.5,
    Table: '',
    Sky: '',
    Note: '',
    TabStates: {},
    LuaScript: '',
    LuaScriptState: '',
    XmlUI: {},
    ObjectStates: [
      {
        Name: 'DeckCustom',
        Transform: {
          posX: 0, posY: 1, posZ: 0,
          rotX: 0, rotY: 180, rotZ: 0,
          scaleX: 1, scaleY: 1, scaleZ: 1,
        },
        Nickname: deckName,
        Description: '',
        CustomDeck: {
          '1': {
            FaceURL: toFileUrl(spritesheetPath),
            BackURL: toFileUrl(backPath),
            NumWidth: numWidth,
            NumHeight: numHeight,
            BackIsHidden: true,
          },
        },
        ContainedObjects: cardNames.map((name, i) => ({
          Name: 'Card',
          Transform: {
            posX: 0, posY: (i + 1) * 2, posZ: 0,
            rotX: 0, rotY: 180, rotZ: 0,
            scaleX: 1, scaleY: 1, scaleZ: 1,
          },
          Nickname: name,
          Description: '',
          CardID: 100 + i,
        })),
      },
    ],
  };
  return JSON.stringify(obj, null, 2);
}

export async function exportTtsSpritesheet(
  deckName: string,
  cardBodies: { body: string; css: string }[],
  cardBackDesign: CardBackDesign,
  cardSize: CardSize,
  dpi: number,
  projectPath: string,
  pc?: ProgressCallback
): Promise<string> {
  const dir = await open({
    title: 'Export TTS — select output folder',
    directory: true,
    defaultPath: `${projectPath}/${deckName}_tts`,
  });
  if (!dir) return '';
  if (pc?.onStatus) pc.onStatus('Rendering cards...');

  const cardImages: Uint8Array[] = [];
  for (let i = 0; i < cardBodies.length; i++) {
    if (pc?.cancelled) return '';
    if (pc?.onProgress) pc.onProgress(i + 1, cardBodies.length);
    if (pc?.onStatus) pc.onStatus(`Rendering card ${i + 1} of ${cardBodies.length}...`);
    const bytes = await captureCardAsPng(
      cardBodies[i].body,
      cardBodies[i].css,
      cardSize.widthMm,
      cardSize.heightMm,
      dpi
    );
    cardImages.push(bytes);
  }

  if (pc?.onStatus) pc.onStatus('Rendering card back...');
  const backBytes = await captureCardBackAsPng(
    cardBackDesign,
    cardSize.widthMm,
    cardSize.heightMm,
    dpi
  );

  if (pc?.onStatus) pc.onStatus('Assembling spritesheet...');
  const cardsPerRow = 10;
  const result = await invoke<TtsSpritesheetResult>('export_tts_spritesheet', {
    outputDir: dir,
    cardImages: cardImages.map(b => Array.from(b)),
    cardBackImage: Array.from(backBytes),
    cardsPerRow,
  });

  const cardNames = cardBodies.map((_, i) => `Card ${i + 1}`);
  const json = generateTtsJson(deckName, cardNames, result.spritesheet_path, result.back_path, result.num_width, result.num_height);

  await invoke('write_csv_content', { path: `${dir}/deck.json`, content: json });

  return `TTS export complete — ${cardImages.length} cards in ${dir}`;
}

interface TtsSpritesheetResult {
  num_width: number;
  num_height: number;
  spritesheet_path: string;
  back_path: string;
}
