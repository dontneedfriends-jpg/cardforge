import type { CanvasElement, ElementProps } from '../../store/canvasStore';

function rgbToHex(color: string): string {
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    if (rgbMatch[4]) {
      const a = Math.round(parseFloat(rgbMatch[4]) * 255).toString(16).padStart(2, '0');
      return `#${r}${g}${b}${a}`;
    }
    return `#${r}${g}${b}`;
  }
  return color;
}

function normalizeColor(color: string): string {
  if (!color) return '#000000';
  if (color.startsWith('rgb')) return rgbToHex(color);
  return color;
}

function cssValue(raw: string, fallback: string): string {
  if (!raw) return normalizeColor(fallback);
  if (raw.includes('gradient') || raw.includes('var(--')) return raw;
  return normalizeColor(raw);
}

const elClassRegex = /(?:^|\s)el-(?:text|field|image|shape|circle|line|icon|container)-/;

function hasElClass(className: string): boolean {
  return elClassRegex.test(className);
}

export interface ElementLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type GetElementLayout = (
  el: HTMLElement,
  parentRect: DOMRect | null,
  rootRect: DOMRect
) => ElementLayout;

export function parseElementTree(
  el: Element,
  parentElId: string | undefined,
  elements: CanvasElement[],
  zIndexRef: { current: number },
  rootRect: DOMRect,
  getLayout: GetElementLayout,
): void {
  if (el.tagName === 'SCRIPT' && el.getAttribute('type') === 'application/cf-manifest') return;

  const htmlEl = el as HTMLElement;
  const className = htmlEl.className || '';

  let type: CanvasElement['type'] = 'container';
  if (className.includes('el-text-')) type = 'text';
  else if (className.includes('el-field-')) type = 'field';
  else if (className.includes('el-image-')) type = 'image';
  else if (className.includes('el-shape-')) type = 'shape';
  else if (className.includes('el-circle-')) type = 'circle';
  else if (className.includes('el-line-')) type = 'line';
  else if (className.includes('el-icon-')) type = 'icon';
  else if (className.includes('el-qr-')) type = 'qr';
  else if (className.includes('el-container-')) type = 'container';

  const parentEleRect = parentElId ? htmlEl.parentElement?.getBoundingClientRect() ?? null : null;
  const layout = getLayout(htmlEl, parentEleRect, rootRect);

  const transform = htmlEl.style.transform;
  let rotation = 0;
  if (transform) {
    const match = transform.match(/rotate\(([-\d.]+)deg\)/);
    if (match) rotation = parseFloat(match[1]);
  }

  const opacity = parseFloat(htmlEl.style.opacity) || 1;
  const zIndexVal = parseInt(htmlEl.style.zIndex) || zIndexRef.current++;

  const props: ElementProps = {};

  switch (type) {
    case 'text':
    case 'field':
      props.text = htmlEl.textContent || '';
      props.fontSize = parseInt(htmlEl.style.fontSize) || 14;
      props.fontWeight = htmlEl.style.fontWeight || 'normal';
      props.color = cssValue(htmlEl.style.color, '#ffffff');
      props.fontFamily = htmlEl.style.fontFamily || '';
      props.textAlign = htmlEl.style.textAlign || 'left';
      props.textStroke = parseInt(htmlEl.style.webkitTextStroke as string) || 0;
      if (htmlEl.style.webkitTextStroke) {
        const parts = (htmlEl.style.webkitTextStroke as string).split(' ');
        if (parts.length >= 2) props.textStrokeColor = parts[parts.length - 1];
      }
      props.textShadow = htmlEl.style.textShadow || '';
      if (type === 'field') {
        const match = props.text.match(/\{\{(.+?)\}\}/);
        props.fieldName = match ? match[1] : 'field';
      }
      break;

    case 'image': {
      const img = htmlEl.querySelector('img');
      if (img) {
        const src = img.getAttribute('src') || '';
        if (src.startsWith('{{') && src.endsWith('}}')) {
          props.isField = true;
          props.fieldName = src.slice(2, -2);
        } else {
          props.src = src;
          props.isField = false;
        }
      }
      break;
    }

    case 'shape':
    case 'circle':
    case 'container':
      props.background = cssValue(htmlEl.style.background || htmlEl.style.backgroundColor, '#444');
      props.fill = cssValue(htmlEl.style.background || htmlEl.style.backgroundColor, '');
      props.borderRadius = parseInt(htmlEl.style.borderRadius) || 0;
      props.borderWidth = parseInt(htmlEl.style.borderWidth) || 0;
      props.borderColor = cssValue(htmlEl.style.borderColor, '#000');
      if (type === 'container') {
        props.padding = parseInt(htmlEl.style.padding) || 8;
        const display = htmlEl.style.display;
        if (display === 'grid') {
          props.layout = 'grid';
          const cols = htmlEl.style.gridTemplateColumns;
          if (cols) {
            const m = cols.match(/repeat\(\s*(\d+)/);
            if (m) props.columns = parseInt(m[1]);
          }
          const rows = htmlEl.style.gridTemplateRows;
          if (rows) {
            const m = rows.match(/repeat\(\s*(\d+)/);
            if (m) props.rows = parseInt(m[1]);
          }
          props.gap = parseInt(htmlEl.style.gap) || 4;
        } else if (display === 'flex') {
          props.layout = 'stack';
          props.direction = htmlEl.style.flexDirection || 'column';
          props.gap = parseInt(htmlEl.style.gap) || 4;
          props.alignItems = htmlEl.style.alignItems || 'stretch';
          props.justifyContent = htmlEl.style.justifyContent || 'start';
        } else {
          props.layout = 'free';
        }
      }
      break;

    case 'line': {
      const line = htmlEl.querySelector('div');
      if (line) {
        props.color = cssValue(line.style.backgroundColor, '#fff');
        props.lineWidth = parseInt(line.style.height) || 2;
      }
      break;
    }

    case 'icon': {
      const dataIcon = htmlEl.getAttribute('data-icon-name');
      const iconPart = className.replace(/^.*\bel-icon-/, '').split(/\s/)[0];
      props.iconName = dataIcon || iconPart || 'star';
      props.iconSize = parseInt(htmlEl.style.fontSize) || 24;
      props.color = cssValue(htmlEl.style.color, '#fff');
      break;
    }

    case 'qr': {
      const span = htmlEl.querySelector('[data-qr-data]') as HTMLElement | null;
      props.data = span?.getAttribute('data-qr-data') || '';
      props.qrSize = parseInt(span?.getAttribute('data-qr-size') || '100') || 100;
      props.color = span?.getAttribute('data-qr-color') || '#000000';
      props.bgColor = span?.getAttribute('data-qr-bg') || '#ffffff';
      props.errorCorrection = (span?.getAttribute('data-qr-ecc') || 'M') as 'L' | 'M' | 'Q' | 'H';
      break;
    }
  }

  const extractableChildren: Element[] = [];
  if (type === 'container' && el.children.length > 0) {
    Array.from(el.children).forEach((child) => {
      if (hasElClass((child as HTMLElement).className || '')) {
        extractableChildren.push(child);
      }
    });
  }

  let sourceHtml: string;
  if (type === 'container' && extractableChildren.length > 0) {
    const clone = htmlEl.cloneNode(true) as HTMLElement;
    while (clone.firstChild) clone.removeChild(clone.firstChild);
    sourceHtml = clone.outerHTML;
  } else {
    sourceHtml = htmlEl.outerHTML;
  }

  const cfId = `parsed_${Date.now()}_${zIndexRef.current}`;
  elements.push({
    id: cfId,
    type,
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
    rotation,
    opacity,
    zIndex: zIndexVal,
    visible: true,
    parentId: parentElId,
    props,
    meta: {
      sourceHtml,
      cfId,
      tagName: el.tagName.toLowerCase(),
      classList: Array.from(htmlEl.classList),
      inlineStyle: htmlEl.getAttribute('style') || '',
    },
  });

  for (const child of extractableChildren) {
    parseElementTree(child, cfId, elements, zIndexRef, rootRect, getLayout);
  }
}
