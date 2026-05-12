import type { CanvasElement } from '../../../store/canvasStore';
import type { CardSize } from '../../../shared/types/project';
import { assetPathToRelative } from '../../../shared/utils/assetPath';
import { iconSvgMap } from '../../../shared/utils/iconPaths';
import { injectPosition, createManifest, injectManifest, extractManifest, normalizeColor } from './sync.utils';
import { mmToPx } from '../../../theme';

/**
 * Рендерит один элемент в HTML+CSS строки.
 * Для container с детьми — рекурсивно рендерит детей внутри.
 */
function renderElement(
  el: CanvasElement,
  childrenMap: Record<string, CanvasElement[]>,
  cssOutput: string[],
  parentX: number = 0,
  parentY: number = 0,
): string {
  const absX = el.x + parentX;
  const absY = el.y + parentY;

  // Если есть sourceHtml — обновляем только позицию
  // Для контейнеров с детьми (извлечёнными эвристическим парсером):
  // пропускаем sourceHtml, чтобы дети рендерились через childrenMap
  const hasChildren = childrenMap[el.id]?.length > 0;
  if (el.meta?.sourceHtml && el.meta.cfId && !(el.type === 'container' && hasChildren)) {
    return injectPosition(
      el.meta.sourceHtml,
      {
        x: absX,
        y: absY,
        width: el.width,
        height: el.height,
        rotation: el.rotation,
        opacity: el.opacity,
        zIndex: el.zIndex,
      },
      el.meta.cfId
    );
  }

  const className = `el-${el.type}-${el.id}`;
  const safeClass = className.replace(/[^a-zA-Z0-9_-]/g, '_');

  const inlineStyle = `position:absolute;left:${absX}px;top:${absY}px;width:${el.width}px;height:${el.height}px;` +
    (el.rotation ? `transform:rotate(${el.rotation}deg);` : '') +
    (el.opacity < 1 ? `opacity:${el.opacity};` : '') +
    `z-index:${el.zIndex};`;

  let cssRules = `.${safeClass} {\n`;
  let innerHtml = '';

  switch (el.type) {
    case 'text': {
      const p = el.props;
      cssRules += `  font-size: ${p.fontSize ?? 14}px;\n`;
      cssRules += `  font-weight: ${p.fontWeight ?? 'normal'};\n`;
      cssRules += `  color: ${p.color ?? '#ffffff'};\n`;
      if (p.fontFamily) cssRules += `  font-family: ${p.fontFamily};\n`;
      cssRules += `  text-align: ${p.textAlign ?? 'left'};\n`;
      cssRules += `  overflow: hidden;\n`;
      cssRules += `  display: flex;\n`;
      cssRules += `  align-items: center;\n`;
      cssRules += `  padding: 2px 4px;\n`;
      cssRules += `  box-sizing: border-box;\n`;
      if (p.textStroke) cssRules += `  -webkit-text-stroke: ${p.textStroke}px ${p.textStrokeColor || '#000'};\n`;
      if (p.textShadow) cssRules += `  text-shadow: ${p.textShadow};\n`;
      cssRules += `}\n\n`;
      innerHtml = escapeHtml(p.text || 'Text');
      break;
    }

    case 'field': {
      const p = el.props;
      cssRules += `  font-size: ${p.fontSize ?? 14}px;\n`;
      cssRules += `  font-weight: ${p.fontWeight ?? 'normal'};\n`;
      cssRules += `  color: ${p.color ?? '#ffffff'};\n`;
      if (p.fontFamily) cssRules += `  font-family: ${p.fontFamily};\n`;
      cssRules += `  text-align: ${p.textAlign ?? 'left'};\n`;
      cssRules += `  overflow: hidden;\n`;
      cssRules += `  display: flex;\n`;
      cssRules += `  align-items: center;\n`;
      cssRules += `  padding: 2px 4px;\n`;
      cssRules += `  box-sizing: border-box;\n`;
      if (p.textStroke) cssRules += `  -webkit-text-stroke: ${p.textStroke}px ${p.textStrokeColor || '#000'};\n`;
      if (p.textShadow) cssRules += `  text-shadow: ${p.textShadow};\n`;
      cssRules += `}\n\n`;
      innerHtml = `{{${p.fieldName || 'field'}}}`;
      break;
    }

    case 'image': {
      const p = el.props;
      cssRules += `  overflow: hidden;\n`;
      cssRules += `}\n\n`;
      if (p.isField && p.fieldName) {
        innerHtml = `<img src="{{${p.fieldName}}}" alt="" style="width:100%;height:100%;object-fit:cover" />`;
      } else {
        const src = assetPathToRelative(p.src || '');
        innerHtml = `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover" />`;
      }
      break;
    }

    case 'shape': {
      const p = el.props;
      if (p.borderRadius) cssRules += `  border-radius: ${p.borderRadius}px;\n`;
      if (p.borderWidth) cssRules += `  border: ${p.borderWidth}px solid ${p.borderColor || '#000'};\n`;
      cssRules += `  background: ${p.background || p.fill || '#444'};\n`;
      cssRules += `}\n\n`;
      break;
    }

    case 'circle': {
      const p = el.props;
      cssRules += `  border-radius: 50%;\n`;
      if (p.borderWidth) cssRules += `  border: ${p.borderWidth}px solid ${p.borderColor || '#000'};\n`;
      cssRules += `  background: ${p.background || '#444'};\n`;
      cssRules += `}\n\n`;
      break;
    }

    case 'line': {
      const p = el.props;
      cssRules += `  display: flex;\n`;
      cssRules += `  align-items: center;\n`;
      cssRules += `  justify-content: center;\n`;
      cssRules += `}\n\n`;
      innerHtml = `<div style="width:100%;height:${p.lineWidth || 2}px;background:${p.color || '#fff'}"></div>`;
      break;
    }

    case 'icon': {
      const p = el.props;
      cssRules += `  display: flex;\n`;
      cssRules += `  align-items: center;\n`;
      cssRules += `  justify-content: center;\n`;
      cssRules += `  color: ${p.color ?? '#fff'};\n`;
      cssRules += `}\n\n`;
      const svg = iconSvgMap[p.iconName ?? ''];
      innerHtml = svg
        ? `<svg viewBox="${svg.viewBox}" style="display:block;width:${p.iconSize ?? 24}px;height:${p.iconSize ?? 24}px">${svg.content}</svg>`
        : (p.iconName ?? '?');
      break;
    }

    case 'qr': {
      const p = el.props;
      cssRules += `  display: flex;\n`;
      cssRules += `  align-items: center;\n`;
      cssRules += `  justify-content: center;\n`;
      cssRules += `}\n\n`;
      innerHtml = `<span data-qr-data="${escapeHtml(p.data || '')}" data-qr-size="${p.qrSize ?? 100}" data-qr-color="${p.color || '#000000'}" data-qr-bg="${p.bgColor || '#ffffff'}" data-qr-ecc="${p.errorCorrection || 'M'}">QR: ${escapeHtml(p.data || 'empty')}</span>`;
      break;
    }

    case 'container': {
      const p = el.props;
      if (p.rawHtml) {
        cssRules += `}\n\n`;
        innerHtml = `\n${p.rawHtml}\n`;
        if (p.rawCss) {
          cssOutput.push(p.rawCss);
        }
      } else {
        if (p.borderRadius) cssRules += `  border-radius: ${p.borderRadius}px;\n`;
        if (p.borderWidth) cssRules += `  border: ${p.borderWidth}px solid ${p.borderColor || 'rgba(255,255,255,0.2)'};\n`;
        cssRules += `  background: ${p.background || 'rgba(255,255,255,0.1)'};\n`;
        if (p.padding) cssRules += `  padding: ${p.padding}px;\n`;
        cssRules += `  box-sizing: border-box;\n`;
        if (p.layout === 'grid') {
          cssRules += `  display: grid;\n`;
          if (p.columns) cssRules += `  grid-template-columns: repeat(${p.columns}, 1fr);\n`;
          if (p.rows) cssRules += `  grid-template-rows: repeat(${p.rows}, 1fr);\n`;
          if (p.gap != null) cssRules += `  gap: ${p.gap}px;\n`;
        } else if (p.layout === 'stack') {
          cssRules += `  display: flex;\n`;
          cssRules += `  flex-direction: ${p.direction || 'column'};\n`;
          if (p.gap != null) cssRules += `  gap: ${p.gap}px;\n`;
          if (p.alignItems) cssRules += `  align-items: ${p.alignItems};\n`;
          if (p.justifyContent) cssRules += `  justify-content: ${p.justifyContent};\n`;
        }
        cssRules += `}\n\n`;
      }

      // Рендерим детей внутри контейнера
      const children = childrenMap[el.id];
      if (children && children.length > 0) {
        const sortedChildren = [...children].sort((a, b) => a.zIndex - b.zIndex);
        let childrenHtml = '';
        for (const child of sortedChildren) {
          childrenHtml += renderElement(child, childrenMap, cssOutput, 0, 0);
          childrenHtml += '\n';
        }
        const isAutoLayout = p.layout && p.layout !== 'free';
        const containerStyle = isAutoLayout
          ? 'position:relative;width:100%;height:100%;'
          : 'position:relative;width:100%;height:100%;overflow:hidden;';
        const childrenFragment = `<div style="${containerStyle}">\n${childrenHtml}</div>`;
        // Если есть rawHtml — аппендик детей после него, иначе дети — единственное содержимое
        if (p.rawHtml) {
          innerHtml = `\n${p.rawHtml}\n${childrenFragment}`;
        } else {
          innerHtml = childrenFragment;
        }
        if (p.padding) {
          innerHtml = `<div style="padding:${p.padding}px;width:100%;height:100%;box-sizing:border-box">\n${innerHtml}\n</div>`;
        }
      }

      break;
    }

    default: {
      cssRules += `}\n\n`;
    }
  }

  cssOutput.push(cssRules);

  const dataAttrs = ` data-cf-id="${el.id}"` +
    (el.type === 'icon' && el.props.iconName ? ` data-icon-name="${el.props.iconName}"` : '');

  return `  <div class="${safeClass}" style="${inlineStyle}"${dataAttrs}>${innerHtml}</div>`;
}

/**
 * Конвертирует CanvasElement[] в HTML + CSS шаблон карты
 */
export function elementsToTemplate(
  elements: CanvasElement[],
  cardSize: CardSize,
  existingCss: string = ''
): { html: string; css: string } {
  const cardW = cardSize.widthMm;
  const cardH = cardSize.heightMm;

  // Строим childrenMap
  const childrenMap: Record<string, CanvasElement[]> = {};
  const topLevel: CanvasElement[] = [];
  for (const el of elements) {
    if (el.parentId) {
      if (!childrenMap[el.parentId]) childrenMap[el.parentId] = [];
      childrenMap[el.parentId].push(el);
    } else {
      topLevel.push(el);
    }
  }

  const cardRootCss = `.card-root {\n  position: relative;\n  width: ${cardW}mm;\n  height: ${cardH}mm;\n  overflow: hidden;\n}\n\n`;

  // Удаляем .card-root из existingCss, чтобы избежать дублирования
  const cleanExistingCss = existingCss ? existingCss.replace(/\.card-root\s*\{[^}]*\}\n*/g, '') : '';
  const buildCss = (cssExtras: string) => cardRootCss + (cleanExistingCss ? cleanExistingCss.trim() + '\n\n' : '') + cssExtras;

  // Fallback: один элемент с sourceHtml
  if (topLevel.length === 1 && childrenMap[topLevel[0].id]?.length === 0) {
    const el = topLevel[0];
    if (el.meta?.sourceHtml && el.meta.cfId) {
      if (el.meta.sourceHtml.includes('card-root')) {
        // Уже содержит card-root → инжектим позицию, не оборачиваем в ещё один
        const updated = injectPosition(el.meta.sourceHtml, {
          x: el.x, y: el.y, width: el.width, height: el.height,
          rotation: el.rotation, opacity: el.opacity, zIndex: el.zIndex,
        }, el.meta.cfId);
        const manifest = createManifest(elements, cardSize);
        return { html: injectManifest(updated, manifest), css: buildCss('') };
      }
      // Без card-root → возвращаем как есть (для сниппетов)
      return { html: el.meta.sourceHtml, css: existingCss };
    }
  }

  const sortedTopLevel = [...topLevel].sort((a, b) => a.zIndex - b.zIndex);

  const cssOutput: string[] = [];

  let html = `<div class="card-root" style="position: relative; width: 100%; height: 100%; overflow: hidden;">\n`;

  for (const el of sortedTopLevel) {
    const elHtml = renderElement(el, childrenMap, cssOutput);
    html += elHtml + '\n';
  }

  html += `</div>`;

  const css = buildCss(cssOutput.join(''));

  // Манифест для round-trip
  const manifest = createManifest(elements, cardSize);
  html = injectManifest(html, manifest);

  return { html, css };
}

/**
 * Создаёт скрытый iframe с переданными HTML+CSS, вызывает fn с document'ом и корнем,
 * затем убирает iframe. Позволяет измерять реальные размеры элементов через
 * getBoundingClientRect/getComputedStyle (поддерживает %, flex, static layout).
 */
function withIframe<T>(
  html: string,
  css: string,
  cardWidthPx: number,
  cardHeightPx: number,
  fn: (doc: Document, root: Element) => T
): T | null {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;visibility:hidden;border:none';
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>
* { box-sizing: border-box; }
body { margin:0;width:${cardWidthPx}px;height:${cardHeightPx}px;overflow:hidden; }
${css}
</style></head><body>${html}</body></html>`);
    doc.close();
    doc.body.getBoundingClientRect(); // принудительный layout

    const root = doc.querySelector('.card-root') ?? (doc.body.children[0] as Element | null);
    if (!root) return null;
    return fn(doc, root);
  } catch (e) {
    console.error('[withIframe]', e);
    return null;
  } finally {
    iframe.parentNode?.removeChild(iframe);
  }
}

/**
 * Парсит HTML/CSS шаблон в CanvasElement[]
 * Быстрый путь: если есть манифест от CardForge — используем его
 */
export function parseTemplateToElements(
  html: string,
  css: string,
  cardSize?: CardSize
): CanvasElement[] | null {
  try {
    // === БЫСТРЫЙ ПУТЬ: проверяем манифест ===
    const manifest = extractManifest(html);
    if (manifest) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<style>${css}</style>${html}`, 'text/html');
      
      const elements: CanvasElement[] = manifest.elements.map((m) => {
        const el = doc.querySelector(`[data-cf-id="${m.cfId}"]`) as HTMLElement;
        const sourceHtml = el?.outerHTML || '';
        
        return {
          id: m.cfId,
          type: m.type as CanvasElement['type'],
          x: m.x,
          y: m.y,
          width: m.width,
          height: m.height,
          rotation: m.rotation,
          opacity: m.opacity,
          zIndex: m.zIndex,
          visible: true,
          parentId: m.parentId,
          props: m.props || {},
          meta: {
            sourceHtml,
            cfId: m.cfId,
            tagName: el?.tagName?.toLowerCase(),
            classList: el ? Array.from(el.classList) : [],
            inlineStyle: el?.getAttribute('style') || '',
          },
        };
      });
      
      return elements;
    }
    
    // === ЭВРИСТИЧЕСКИЙ ПАРСЕР (legacy / ручной HTML) ===

    const cardW = cardSize ? mmToPx(cardSize.widthMm) : 600;
    const cardH = cardSize ? mmToPx(cardSize.heightMm) : 800;

    // Пытаемся измерить через iframe (поддерживает любые раскладки: absolute, flex, %-размеры)
    const iframeResult = withIframe(html, css, cardW, cardH, (doc, root) => {
      const elements: CanvasElement[] = [];
      let zIndex = 0;
      const rootRect = root.getBoundingClientRect();

      const elClassRegex = /(?:^|\s)el-(?:text|field|image|shape|circle|line|icon|container)-/;

      function hasElClass(className: string): boolean {
        return elClassRegex.test(className);
      }

      function parseElementTree(
        el: Element,
        parentElId?: string
      ): void {
        if (el.tagName === 'SCRIPT' && el.getAttribute('type') === 'application/cf-manifest') return;

        const htmlEl = el as HTMLElement;
        const className = htmlEl.className || '';

        // Определяем тип по классу
        let type: CanvasElement['type'] = 'container';
        if (className.includes('el-text-')) type = 'text';
        else if (className.includes('el-field-')) type = 'field';
        else if (className.includes('el-image-')) type = 'image';
        else if (className.includes('el-shape-')) type = 'shape';
        else if (className.includes('el-circle-')) type = 'circle';
        else if (className.includes('el-line-')) type = 'line';
        else if (className.includes('el-icon-')) type = 'icon';
        else if (className.includes('el-container-')) type = 'container';
        else if (className.includes('el-qr-')) type = 'qr';

        // Позиция через getBoundingClientRect — работает для любых раскладок
        const parentRect = parentElId ? el.parentElement?.getBoundingClientRect() ?? rootRect : rootRect;
        const rect = htmlEl.getBoundingClientRect();
        const x = rect.left - parentRect.left;
        const y = rect.top - parentRect.top;

        // Размеры через computedStyle (не подвержен влиянию rotation)
        const cs = doc.defaultView!.getComputedStyle(htmlEl);
        const width = parseFloat(cs.width) || rect.width;
        const height = parseFloat(cs.height) || rect.height;

        // Rotation/opacity/z-index из inline style (getBoundingClientRect их не даёт)
        const transform = htmlEl.style.transform;
        let rotation = 0;
        if (transform) {
          const match = transform.match(/rotate\(([-\d.]+)deg\)/);
          if (match) rotation = parseFloat(match[1]);
        }

        const opacity = parseFloat(htmlEl.style.opacity) || 1;
        const zIndexVal = parseInt(htmlEl.style.zIndex) || zIndex++;

        // Пропсы (те же, что и раньше)
        const props: Record<string, any> = {};

        switch (type) {
          case 'text':
          case 'field':
            props.text = htmlEl.textContent || '';
            props.fontSize = parseInt(htmlEl.style.fontSize) || 14;
            props.fontWeight = htmlEl.style.fontWeight || 'normal';
            props.color = cssValue(htmlEl.style.color, '#ffffff');
            props.fontFamily = htmlEl.style.fontFamily || '';
            props.textAlign = htmlEl.style.textAlign || 'left';
            props.textStroke = parseInt(htmlEl.style.webkitTextStroke) || 0;
            if (htmlEl.style.webkitTextStroke) {
              const parts = htmlEl.style.webkitTextStroke.split(' ');
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

        // Находим извлекаемых детей (только для контейнеров с el-* классами)
        const extractableChildren: Element[] = [];
        if (type === 'container' && el.children.length > 0) {
          Array.from(el.children).forEach((child) => {
            if (hasElClass((child as HTMLElement).className || '')) {
              extractableChildren.push(child);
            }
          });
        }

        // sourceHtml: для контейнеров с детьми — обрезаем детей
        let sourceHtml: string;
        if (type === 'container' && extractableChildren.length > 0) {
          const clone = htmlEl.cloneNode(true) as HTMLElement;
          while (clone.firstChild) clone.removeChild(clone.firstChild);
          sourceHtml = clone.outerHTML;
        } else {
          sourceHtml = htmlEl.outerHTML;
        }

        const cfId = `parsed_${Date.now()}_${zIndex}`;
        elements.push({
          id: cfId,
          type, x, y, width, height, rotation, opacity,
          zIndex: zIndexVal, visible: true,
          parentId: parentElId,
          props,
          meta: {
            sourceHtml, cfId,
            tagName: el.tagName.toLowerCase(),
            classList: Array.from(htmlEl.classList),
            inlineStyle: htmlEl.getAttribute('style') || '',
          },
        });

        for (const child of extractableChildren) {
          parseElementTree(child, cfId);
        }
      }

      Array.from(root.children).forEach((child) => parseElementTree(child));
      return elements;
    });

    if (iframeResult) return iframeResult;

    // Fallback: если iframe не сработал (редко), используем DOMParser + inline style
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<style>${css}</style>${html}`, 'text/html');
    let root = doc.querySelector('.card-root');
    if (!root) {
      if (doc.body.children.length > 0) root = doc.body.children[0] as HTMLElement;
    }
    if (!root) return null;

    const elements: CanvasElement[] = [];
    let zIndex = 0;
    const elClassRegex = /(?:^|\s)el-(?:text|field|image|shape|circle|line|icon|container)-/;

    function hasElClass(className: string): boolean { return elClassRegex.test(className); }

    function parseElementTree(el: HTMLElement, parentElId?: string): void {
      if (el.tagName === 'SCRIPT' && el.getAttribute('type') === 'application/cf-manifest') return;
      const className = el.className || '';
      let type: CanvasElement['type'] = 'container';
      if (className.includes('el-text-')) type = 'text';
      else if (className.includes('el-field-')) type = 'field';
      else if (className.includes('el-image-')) type = 'image';
      else if (className.includes('el-shape-')) type = 'shape';
      else if (className.includes('el-circle-')) type = 'circle';
      else if (className.includes('el-line-')) type = 'line';
      else if (className.includes('el-icon-')) type = 'icon';
      else if (className.includes('el-container-')) type = 'container';
      else if (className.includes('el-qr-')) type = 'qr';

      const style = el.style;
      const x = parseFloat(style.left) || 0;
      const y = parseFloat(style.top) || 0;
      const width = parseFloat(style.width) || 100;
      const height = parseFloat(style.height) || 100;
      const transform = style.transform;
      let rotation = 0;
      if (transform) { const m = transform.match(/rotate\(([-\d.]+)deg\)/); if (m) rotation = parseFloat(m[1]); }
      const opacity = parseFloat(style.opacity) || 1;
      const zIndexVal = parseInt(style.zIndex) || zIndex++;

      const props: Record<string, any> = {};
      switch (type) {
        case 'text': case 'field':
          props.text = el.textContent || '';
          props.fontSize = parseInt(el.style.fontSize) || 14;
          props.fontWeight = el.style.fontWeight || 'normal';
          props.color = cssValue(el.style.color, '#ffffff');
          props.fontFamily = el.style.fontFamily || '';
          props.textAlign = el.style.textAlign || 'left';
          props.textStroke = parseInt(el.style.webkitTextStroke) || 0;
          if (el.style.webkitTextStroke) { const parts = el.style.webkitTextStroke.split(' '); if (parts.length >= 2) props.textStrokeColor = parts[parts.length - 1]; }
          props.textShadow = el.style.textShadow || '';
          if (type === 'field') { const m = props.text.match(/\{\{(.+?)\}\}/); props.fieldName = m ? m[1] : 'field'; }
          break;
        case 'image': {
          const img = el.querySelector('img');
          if (img) {
            const src = img.getAttribute('src') || '';
            if (src.startsWith('{{') && src.endsWith('}}')) { props.isField = true; props.fieldName = src.slice(2, -2); }
            else { props.src = src; props.isField = false; }
          }
          break;
        }
        case 'shape': case 'circle': case 'container':
          props.background = cssValue(el.style.background || el.style.backgroundColor, '#444');
          props.fill = cssValue(el.style.background || el.style.backgroundColor, '');
          props.borderRadius = parseInt(el.style.borderRadius) || 0;
          props.borderWidth = parseInt(el.style.borderWidth) || 0;
          props.borderColor = cssValue(el.style.borderColor, '#000');
          if (type === 'container') {
            props.padding = parseInt(el.style.padding) || 8;
            const display = el.style.display;
            if (display === 'grid') {
              props.layout = 'grid';
              const cols = el.style.gridTemplateColumns;
              if (cols) { const m = cols.match(/repeat\(\s*(\d+)/); if (m) props.columns = parseInt(m[1]); }
              const rows = el.style.gridTemplateRows;
              if (rows) { const m = rows.match(/repeat\(\s*(\d+)/); if (m) props.rows = parseInt(m[1]); }
              props.gap = parseInt(el.style.gap) || 4;
            } else if (display === 'flex') {
              props.layout = 'stack';
              props.direction = el.style.flexDirection || 'column';
              props.gap = parseInt(el.style.gap) || 4;
              props.alignItems = el.style.alignItems || 'stretch';
              props.justifyContent = el.style.justifyContent || 'start';
            } else {
              props.layout = 'free';
            }
          }
          break;
        case 'line': {
          const line = el.querySelector('div');
          if (line) { props.color = cssValue(line.style.backgroundColor, '#fff'); props.lineWidth = parseInt(line.style.height) || 2; }
          break;
        }
        case 'icon': {
          const dataIcon = el.getAttribute('data-icon-name');
          const iconPart = className.replace(/^.*\bel-icon-/, '').split(/\s/)[0];
          props.iconName = dataIcon || iconPart || 'star';
          props.iconSize = parseInt(el.style.fontSize) || 24;
          props.color = cssValue(el.style.color, '#fff');
          break;
        }
        case 'qr': {
          const span = el.querySelector('[data-qr-data]') as HTMLElement | null;
          props.data = span?.getAttribute('data-qr-data') || '';
          props.qrSize = parseInt(span?.getAttribute('data-qr-size') || '100') || 100;
          props.color = span?.getAttribute('data-qr-color') || '#000000';
          props.bgColor = span?.getAttribute('data-qr-bg') || '#ffffff';
          props.errorCorrection = (span?.getAttribute('data-qr-ecc') || 'M') as 'L' | 'M' | 'Q' | 'H';
          break;
        }
      }

      const extractableChildren: HTMLElement[] = [];
      if (type === 'container' && el.children.length > 0) {
        Array.from(el.children).forEach((child) => { if (hasElClass((child as HTMLElement).className || '')) extractableChildren.push(child as HTMLElement); });
      }

      let sourceHtml: string;
      if (type === 'container' && extractableChildren.length > 0) {
        const clone = el.cloneNode(true) as HTMLElement;
        while (clone.firstChild) clone.removeChild(clone.firstChild);
        sourceHtml = clone.outerHTML;
      } else {
        sourceHtml = el.outerHTML;
      }

      const cfId = `parsed_${Date.now()}_${zIndex}`;
      elements.push({ id: cfId, type, x, y, width, height, rotation, opacity, zIndex: zIndexVal, visible: true, parentId: parentElId, props, meta: { sourceHtml, cfId, tagName: el.tagName.toLowerCase(), classList: Array.from(el.classList), inlineStyle: el.getAttribute('style') || '' } });

      for (const child of extractableChildren) parseElementTree(child, cfId);
    }

    Array.from(root.children).forEach((child) => parseElementTree(child as HTMLElement));

    // Оставляем запасной fallback для статичного HTML
    if (elements.length > 0 && !elements.some((e) => !e.parentId && (e.x !== 0 || e.y !== 0))) {
      const fbId = `fallback_${Date.now()}`;
      const fbSource = root.outerHTML;
      return [{ id: fbId, type: 'container', x: 0, y: 0, width: cardW, height: cardH, rotation: 0, opacity: 1, zIndex: 0, visible: true, props: { background: 'transparent', borderRadius: 0, borderWidth: 0, padding: 0 }, meta: { sourceHtml: fbSource, cfId: fbId, tagName: root.tagName.toLowerCase(), classList: Array.from(root.classList), inlineStyle: root.getAttribute('style') || '' } }];
    }

    return elements;
  } catch (error) {
    console.error('Error parsing template:', error);
    return null;
  }
}

/**
 * Возвращает CSS-значение как есть если это gradient или var(),
 * иначе нормализует цвет через normalizeColor.
 */
function cssValue(raw: string, fallback: string): string {
  if (!raw) return normalizeColor(fallback);
  if (raw.includes('gradient') || raw.includes('var(--')) return raw;
  return normalizeColor(raw);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
