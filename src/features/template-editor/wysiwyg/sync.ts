import type { CanvasElement } from '../../../store/canvasStore';
import type { CardSize } from '../../../shared/types/project';
import { assetPathToRelative } from '../../../shared/utils/assetPath';

/**
 * Конвертирует CanvasElement[] в HTML + CSS шаблон карты
 */
export function elementsToTemplate(
  elements: CanvasElement[],
  cardSize: CardSize
): { html: string; css: string } {
  const cardW = cardSize.widthMm;
  const cardH = cardSize.heightMm;
  
  let html = `<div class="card-root" style="position: relative; width: 100%; height: 100%; overflow: hidden;">\n`;
  let css = `.card-root {\n  position: relative;\n  width: ${cardW}mm;\n  height: ${cardH}mm;\n  overflow: hidden;\n}\n\n`;

  elements.forEach((el) => {
    const className = `el-${el.type}-${el.id}`;
    const safeClass = className.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Inline style с позицией (для парсинга обратно)
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
        cssRules += `  font-size: ${p.iconSize ?? 24}px;\n`;
        cssRules += `  color: ${p.color ?? '#fff'};\n`;
        cssRules += `}\n\n`;
        const iconMap: Record<string, string> = {
          heart: '♥', star: '★', shield: '◆', sword: '†', bolt: '⚡',
          fire: '♠', water: '♦', leaf: '♣', moon: '☽', sun: '☀',
          skull: '💀', crown: '♛', gear: '⚙', info: 'ℹ', warning: '⚠',
          check: '✓', cross: '✗', arrow_up: '↑', arrow_down: '↓',
          arrow_left: '←', arrow_right: '→', plus: '+', minus: '−',
        };
        const symbol = iconMap[p.iconName ?? ''] || (p.iconName ?? '?');
        html += `  <div class="${safeClass}" style="${inlineStyle}">${symbol}</div>\n`;
        break;
      }
      
      case 'container': {
        const p = el.props;
        if (p.borderRadius) cssRules += `  border-radius: ${p.borderRadius}px;\n`;
        if (p.borderWidth) cssRules += `  border: ${p.borderWidth}px solid ${p.borderColor || 'rgba(255,255,255,0.2)'};\n`;
        cssRules += `  background: ${p.background || 'rgba(255,255,255,0.1)'};\n`;
        if (p.padding) cssRules += `  padding: ${p.padding}px;\n`;
        cssRules += `  box-sizing: border-box;\n`;
        cssRules += `}\n\n`;
        html += `  <div class="${safeClass}" style="${inlineStyle}"></div>\n`;
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

  return { html, css };
}

/**
 * Парсит HTML/CSS шаблон в CanvasElement[]
 */
export function parseTemplateToElements(html: string, css: string): CanvasElement[] | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<style>${css}</style>${html}`, 'text/html');
    const root = doc.querySelector('.card-root');
    
    if (!root) return null;

    const elements: CanvasElement[] = [];
    let zIndex = 0;

    Array.from(root.children).forEach((child) => {
      const el = child as HTMLElement;
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
          props.color = el.style.color || '#ffffff';
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
          props.background = el.style.backgroundColor || '#444';
          props.fill = el.style.backgroundColor || '';
          props.borderRadius = parseInt(el.style.borderRadius) || 0;
          props.borderWidth = parseInt(el.style.borderWidth) || 0;
          props.borderColor = el.style.borderColor || '#000';
          if (type === 'container') {
            props.padding = parseInt(el.style.padding) || 8;
          }
          break;
          
        case 'line': {
          const line = el.querySelector('div');
          if (line) {
            props.color = line.style.backgroundColor || '#fff';
            props.lineWidth = parseInt(line.style.height) || 2;
          }
          break;
        }
          
        case 'icon':
          props.iconName = 'star';
          props.iconSize = parseInt(el.style.fontSize) || 24;
          props.color = el.style.color || '#fff';
          break;
      }

      elements.push({
        id: `parsed_${Date.now()}_${zIndex}`,
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
      });
    });

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
