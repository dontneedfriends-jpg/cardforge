import type { CanvasElement } from '../../../store/canvasStore';
import type { CardSize } from '../../../shared/types/project';
import { assetPathToRelative } from '../../../shared/utils/assetPath';
import { iconSvgMap } from '../../../shared/utils/iconPaths';
import { injectPosition, createManifest, injectManifest, extractManifest, normalizeColor } from './sync.utils';
import { mmToPx } from '../../../theme';

/**
 * Конвертирует CanvasElement[] в HTML + CSS шаблон карты
 * Round-trip: при наличии meta.sourceHtml позиция обновляется, остальное сохраняется
 */
export function elementsToTemplate(
  elements: CanvasElement[],
  cardSize: CardSize,
  existingCss: string = ''
): { html: string; css: string } {
  const cardW = cardSize.widthMm;
  const cardH = cardSize.heightMm;
  
  // Сортируем по zIndex для стабильного порядка в DOM
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  
  // Проверяем: это fallback для пользовательского HTML без card-root?
  if (sortedElements.length === 1) {
    const el = sortedElements[0];
    if (el.meta?.sourceHtml && !el.meta.sourceHtml.includes('card-root')) {
      // Возвращаем исходный HTML БЕЗ изменений — не добавляем position и data-cf-id
      return { html: el.meta.sourceHtml, css: existingCss };
    }
  }
  
  let html = `<div class="card-root" style="position: relative; width: 100%; height: 100%; overflow: hidden;">\n`;
  let css = existingCss || `.card-root {\n  position: relative;\n  width: ${cardW}mm;\n  height: ${cardH}mm;\n  overflow: hidden;\n}\n\n`;

  sortedElements.forEach((el) => {
    // Приоритет: если есть sourceHtml — обновляем только позицию
    if (el.meta?.sourceHtml && el.meta.cfId) {
      const updatedHtml = injectPosition(
        el.meta.sourceHtml,
        {
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: el.rotation,
          opacity: el.opacity,
          zIndex: el.zIndex,
        },
        el.meta.cfId
      );
      html += `  ${updatedHtml}\n`;
      return;
    }
    
    // Генерация из props (legacy path или новые элементы из визуального редактора)
    const className = `el-${el.type}-${el.id}`;
    const safeClass = className.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Inline style с позицией
    const inlineStyle = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;` +
      (el.rotation ? `transform:rotate(${el.rotation}deg);` : '') +
      (el.opacity < 1 ? `opacity:${el.opacity};` : '') +
      (el.zIndex ? `z-index:${el.zIndex};` : '');
    
    // CSS класс для визуальных свойств
    let cssRules = `.${safeClass} {\n`;
    
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
        cssRules += `}\n\n`;
        html += `  <div class="${safeClass}" style="${inlineStyle}">${escapeHtml(p.text || 'Text')}</div>\n`;
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
        cssRules += `}\n\n`;
        html += `  <span class="${safeClass}" style="${inlineStyle}">{{${p.fieldName || 'field'}}}</span>\n`;
        break;
      }
      
      case 'image': {
        const p = el.props;
        cssRules += `  overflow: hidden;\n`;
        cssRules += `}\n\n`;
        if (p.isField && p.fieldName) {
          html += `  <img class="${safeClass}" src="{{${p.fieldName}}}" alt="" style="${inlineStyle};width:100%;height:100%;object-fit:cover" />\n`;
        } else {
          // Convert any full path to assets/ relative path (Windows-safe)
          const src = assetPathToRelative(p.src || '');
          html += `  <div class="${safeClass}" style="${inlineStyle}"><img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover" /></div>\n`;
        }
        break;
      }
      
      case 'shape': {
        const p = el.props;
        if (p.borderRadius) cssRules += `  border-radius: ${p.borderRadius}px;\n`;
        if (p.borderWidth) cssRules += `  border: ${p.borderWidth}px solid ${p.borderColor || '#000'};\n`;
        cssRules += `  background: ${p.background || p.fill || '#444'};\n`;
        cssRules += `}\n\n`;
        html += `  <div class="${safeClass}" style="${inlineStyle}"></div>\n`;
        break;
      }
      
      case 'circle': {
        const p = el.props;
        cssRules += `  border-radius: 50%;\n`;
        if (p.borderWidth) cssRules += `  border: ${p.borderWidth}px solid ${p.borderColor || '#000'};\n`;
        cssRules += `  background: ${p.background || '#444'};\n`;
        cssRules += `}\n\n`;
        html += `  <div class="${safeClass}" style="${inlineStyle}"></div>\n`;
        break;
      }
      
      case 'line': {
        const p = el.props;
        cssRules += `  display: flex;\n`;
        cssRules += `  align-items: center;\n`;
        cssRules += `  justify-content: center;\n`;
        cssRules += `}\n\n`;
        html += `  <div class="${safeClass}" style="${inlineStyle}"><div style="width:100%;height:${p.lineWidth || 2}px;background:${p.color || '#fff'}"></div></div>\n`;
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
        const svgHtml = svg
          ? `<svg viewBox="${svg.viewBox}" style="display:block;width:${p.iconSize ?? 24}px;height:${p.iconSize ?? 24}px">${svg.content}</svg>`
          : (p.iconName ?? '?');
        html += `  <div class="${safeClass}" style="${inlineStyle}">${svgHtml}</div>\n`;
        break;
      }
      
      case 'container': {
        const p = el.props;
        if (p.rawHtml) {
          // Preserve raw HTML content (from code editor → visual fallback)
          html += `  <div class="${safeClass}" style="${inlineStyle}">\n${p.rawHtml}\n  </div>\n`;
          if (p.rawCss) {
            css += p.rawCss + '\n\n';
          }
        } else {
          if (p.borderRadius) cssRules += `  border-radius: ${p.borderRadius}px;\n`;
          if (p.borderWidth) cssRules += `  border: ${p.borderWidth}px solid ${p.borderColor || 'rgba(255,255,255,0.2)'};\n`;
          cssRules += `  background: ${p.background || 'rgba(255,255,255,0.1)'};\n`;
          if (p.padding) cssRules += `  padding: ${p.padding}px;\n`;
          cssRules += `  box-sizing: border-box;\n`;
          cssRules += `}\n\n`;
          html += `  <div class="${safeClass}" style="${inlineStyle}"></div>\n`;
        }
        break;
      }
      
      default: {
        cssRules += `}\n\n`;
        html += `  <div class="${safeClass}" style="${inlineStyle}"></div>\n`;
      }
    }
    
    css += cssRules;
  });

  html += `</div>`;

  // Встраиваем манифест для round-trip синхронизации
  const manifest = createManifest(sortedElements, cardSize);
  html = injectManifest(html, manifest);

  return { html, css };
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
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<style>${css}</style>${html}`, 'text/html');
    
    // Ищем корень: .card-root или первый блочный элемент в body
    let root = doc.querySelector('.card-root');
    if (!root) {
      const body = doc.body;
      if (body && body.children.length > 0) {
        root = body.children[0] as HTMLElement;
      }
    }
    
    if (!root) return null;

    const elements: CanvasElement[] = [];
    let zIndex = 0;

    Array.from(root.children).forEach((child) => {
      const el = child as HTMLElement;
      
      // Пропускаем манифест и другие служебные элементы
      if (el.tagName === 'SCRIPT' && el.getAttribute('type') === 'application/cf-manifest') {
        return;
      }
      
      const className = el.className || '';
      
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

      // Извлекаем позицию из inline style (где мы их записали)
      const style = el.style;
      const x = parseFloat(style.left) || 0;
      const y = parseFloat(style.top) || 0;
      const width = parseFloat(style.width) || 100;
      const height = parseFloat(style.height) || 100;
      
      // Извлекаем rotation
      const transform = style.transform;
      let rotation = 0;
      if (transform) {
        const match = transform.match(/rotate\(([-\d.]+)deg\)/);
        if (match) rotation = parseFloat(match[1]);
      }

      // Извлекаем opacity
      const opacity = parseFloat(style.opacity) || 1;
      const zIndexVal = parseInt(style.zIndex) || zIndex++;

      // Извлекаем пропсы в зависимости от типа
      const props: Record<string, any> = {};
      
      switch (type) {
        case 'text':
        case 'field':
          props.text = el.textContent || '';
          props.fontSize = parseInt(el.style.fontSize) || 14;
          props.fontWeight = el.style.fontWeight || 'normal';
          props.color = normalizeColor(el.style.color || '#ffffff');
          props.fontFamily = el.style.fontFamily || '';
          props.textAlign = el.style.textAlign || 'left';
          if (type === 'field') {
            const match = props.text.match(/\{\{(.+?)\}\}/);
            props.fieldName = match ? match[1] : 'field';
          }
          break;
          
        case 'image': {
          const img = el.querySelector('img');
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
          props.background = normalizeColor(el.style.backgroundColor || '#444');
          props.fill = normalizeColor(el.style.backgroundColor || '');
          props.borderRadius = parseInt(el.style.borderRadius) || 0;
          props.borderWidth = parseInt(el.style.borderWidth) || 0;
          props.borderColor = normalizeColor(el.style.borderColor || '#000');
          if (type === 'container') {
            props.padding = parseInt(el.style.padding) || 8;
          }
          break;
          
        case 'line': {
          const line = el.querySelector('div');
          if (line) {
            props.color = normalizeColor(line.style.backgroundColor || '#fff');
            props.lineWidth = parseInt(line.style.height) || 2;
          }
          break;
        }
          
        case 'icon': {
          const iconPart = className.replace(/^.*\bel-icon-/, '').split(/\s/)[0];
          props.iconName = iconPart || 'star';
          props.iconSize = parseInt(el.style.fontSize) || 24;
          props.color = normalizeColor(el.style.color || '#fff');
          break;
        }
      }

      const cfId = `parsed_${Date.now()}_${zIndex}`;
      elements.push({
        id: cfId,
        type,
        x,
        y,
        width,
        height,
        rotation,
        opacity,
        zIndex: zIndexVal,
        visible: true,
        props,
        meta: {
          sourceHtml: el.outerHTML,
          cfId,
          tagName: el.tagName.toLowerCase(),
          classList: Array.from(el.classList),
          inlineStyle: el.getAttribute('style') || '',
        },
      });
    });

    // Fallback: если все элементы без позиционирования (x=0,y=0) — значит это
    // обычный HTML без absolute positioning. Создаём один контейнер на всю карту.
    const hasPositionedElements = elements.some((el) => el.x !== 0 || el.y !== 0);
    if (elements.length > 0 && !hasPositionedElements) {
      // Один контейнер с полным HTML root (сохраняем outerHTML чтобы не потерять корневой тег)
      const cfId = `fallback_${Date.now()}`;
      const sourceHtml = root.outerHTML;
      // Используем реальные размеры карты в пикселях
      const cardW = cardSize ? mmToPx(cardSize.widthMm) : 600;
      const cardH = cardSize ? mmToPx(cardSize.heightMm) : 800;
      return [{
        id: cfId,
        type: 'container',
        x: 0,
        y: 0,
        width: cardW,
        height: cardH,
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        visible: true,
        props: {
          background: 'transparent',
          borderRadius: 0,
          borderWidth: 0,
          padding: 0,
        },
        meta: {
          sourceHtml,
          cfId,
          tagName: root.tagName.toLowerCase(),
          classList: Array.from(root.classList),
          inlineStyle: root.getAttribute('style') || '',
        },
      }];
    }

    return elements;
  } catch (error) {
    console.error('Error parsing template:', error);
    return null;
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
