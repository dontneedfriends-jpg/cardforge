/**
 * Утилиты для двусторонней синхронизации Code ↔ Visual
 */

export function rgbToHex(color: string): string {
  // rgb(r, g, b) → #rrggbb
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

export function normalizeColor(color: string): string {
  if (!color) return '#000000';
  if (color.startsWith('rgb')) return rgbToHex(color);
  return color;
}

/**
 * Вставляет/обновляет позиционные атрибуты в HTML-строке
 * Сохраняет всё остальное (классы, стили, контент) без изменений
 */
export function injectPosition(
  sourceHtml: string,
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    opacity?: number;
    zIndex?: number;
  },
  cfId?: string
): string {
  const { x, y, width, height, rotation, opacity, zIndex } = position;
  
  // Парсим первый тег
  const tagMatch = sourceHtml.match(/^(<\w+)([^>]*)(>.*)$/s);
  if (!tagMatch) return sourceHtml;
  
  const [, openTag, attrs, closeAndContent] = tagMatch;
  
  // Извлекаем текущий style
  const styleMatch = attrs.match(/\sstyle="([^"]*)"/);
  let styles: Record<string, string> = {};
  
  if (styleMatch) {
    // Парсим существующие стили
    styleMatch[1].split(';').forEach((rule) => {
      const [prop, val] = rule.split(':').map((s) => s.trim());
      if (prop && val) styles[prop] = val;
    });
  }
  
  // Обновляем позиционные стили
  styles['position'] = 'absolute';
  styles['left'] = `${x}px`;
  styles['top'] = `${y}px`;
  styles['width'] = `${width}px`;
  styles['height'] = `${height}px`;
  
  if (rotation && rotation !== 0) {
    styles['transform'] = `rotate(${rotation}deg)`;
  } else {
    delete styles['transform'];
  }
  
  if (opacity !== undefined && opacity !== 1) {
    styles['opacity'] = String(opacity);
  } else {
    delete styles['opacity'];
  }
  
  if (zIndex !== undefined) {
    styles['z-index'] = String(zIndex);
  } else {
    delete styles['z-index'];
  }
  
  // Собираем style обратно
  const styleStr = Object.entries(styles)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  
  // Заменяем или добавляем style
  let newAttrs = attrs;
  if (styleMatch) {
    newAttrs = attrs.replace(/\sstyle="[^"]*"/, ` style="${styleStr}"`);
  } else {
    newAttrs = `${attrs} style="${styleStr}"`;
  }
  
  // Добавляем/обновляем data-cf-id
  if (cfId) {
    if (newAttrs.includes('data-cf-id=')) {
      newAttrs = newAttrs.replace(/data-cf-id="[^"]*"/, `data-cf-id="${cfId}"`);
    } else {
      newAttrs = `${newAttrs} data-cf-id="${cfId}"`;
    }
  }
  
  return `${openTag}${newAttrs}${closeAndContent}`;
}

/**
 * Извлекает манифест из HTML если он есть
 */
export function extractManifest(html: string): {
  elements: Array<{
    cfId: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    zIndex: number;
    props: Record<string, any>;
  }>;
  cardSize?: { widthMm: number; heightMm: number; bleedMm: number };
} | null {
  const manifestMatch = html.match(/<script type="application\/cf-manifest">([\s\S]*?)<\/script>/);
  if (!manifestMatch) return null;
  
  try {
    return JSON.parse(manifestMatch[1]);
  } catch {
    return null;
  }
}

/**
 * Создаёт манифест из CanvasElement[]
 */
export function createManifest(
  elements: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    zIndex: number;
    props: Record<string, any>;
    meta?: { sourceHtml?: string };
  }>,
  cardSize: { widthMm: number; heightMm: number; bleedMm: number }
): string {
  const manifest = {
    version: 2,
    cardSize,
    elements: elements.map((el) => ({
      cfId: el.id,
      type: el.type,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      rotation: el.rotation,
      opacity: el.opacity,
      zIndex: el.zIndex,
      props: el.props,
    })),
  };
  
  return JSON.stringify(manifest);
}

/**
 * Встраивает манифест в HTML
 */
export function injectManifest(html: string, manifest: string): string {
  // Удаляем старый манифест если есть
  const cleaned = html.replace(/\s*<script type="application\/cf-manifest">[\s\S]*?<\/script>\s*/, '');
  
  // Вставляем перед закрывающим </div> card-root
  const manifestScript = `\n<script type="application/cf-manifest">${manifest}</script>`;
  
  if (cleaned.endsWith('</div>')) {
    return cleaned.slice(0, -6) + manifestScript + '\n</div>';
  }
  
  return cleaned + manifestScript;
}