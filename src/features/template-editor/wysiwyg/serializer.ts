import type { CardSize } from '../../../shared/types/project';

interface SerializedNode {
  type: { resolvedName: string } | string;
  props: Record<string, any>;
  nodes: string[];
  isCanvas?: boolean;
  displayName?: string;
}

export interface NodeMap {
  [nodeId: string]: SerializedNode;
}

export function craftStateToTemplate(
  craftJson: string,
  _cardSize: CardSize
): { html: string; css: string } {
  let parsed: NodeMap;
  try {
    parsed = JSON.parse(craftJson);
  } catch {
    return { html: '<div class="card-root"></div>', css: '' };
  }

  const rootId = Object.keys(parsed).find(
    id => parsed[id].type === 'div' || (typeof parsed[id].type === 'object' && (parsed[id].type as any).resolvedName === 'div')
  ) || Object.keys(parsed)[0];

  if (!rootId) return { html: '<div class="card-root"></div>', css: '' };

  const cssRules: string[] = [];
  const rendered = renderNode(rootId, parsed, cssRules);
  const html = `<div class="card-root">\n${indent(rendered, 1)}\n</div>`;
  const css = `.card-root {\n  position: relative;\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n}\n${cssRules.join('\n\n')}`;

  return { html, css };
}

function renderNode(id: string, nodes: NodeMap, cssRules: string[]): string {
  const node = nodes[id];
  if (!node) return '';

  const type = typeof node.type === 'string' ? node.type : node.type.resolvedName;
  const p = node.props || {};

  const className = `el-${id}`;

  const cssProps: string[] = [
    `position: absolute`,
    `left: ${p.x ?? 0}px`,
    `top: ${p.y ?? 0}px`,
    `width: ${p.width ?? 200}px`,
    `height: ${p.height ?? 30}px`,
  ];

  if (p.rotation) cssProps.push(`transform: rotate(${p.rotation}deg)`);
  if (p.opacity !== undefined && p.opacity < 1) cssProps.push(`opacity: ${p.opacity}`);
  if (p.zIndex !== undefined) cssProps.push(`z-index: ${p.zIndex}`);
  if (p.visible === false) cssProps.push(`display: none`);

  const childrenHtml = (node.nodes || []).map(childId => renderNode(childId, nodes, cssRules)).join('\n');

  switch (type) {
    case 'TextElement': {
      cssProps.push(`font-size: ${p.fontSize ?? 14}px`);
      cssProps.push(`font-weight: ${p.fontWeight ?? 'normal'}`);
      cssProps.push(`color: ${p.color ?? '#ffffff'}`);
      if (p.fontFamily) cssProps.push(`font-family: ${p.fontFamily}`);
      cssProps.push(`text-align: ${p.textAlign ?? 'left'}`);
      cssProps.push(`overflow: hidden`);
      cssRules.push(`.${className} {\n  ${cssProps.map(c => `  ${c};`).join('\n')}\n}`);
      return `<div class="${className}">${escHtml(p.text || 'Text')}</div>`;
    }
    case 'FieldBadge': {
      cssProps.push(`font-size: ${p.fontSize ?? 14}px`);
      cssProps.push(`font-weight: ${p.fontWeight ?? 'normal'}`);
      cssProps.push(`color: ${p.color ?? '#ffffff'}`);
      if (p.fontFamily) cssProps.push(`font-family: ${p.fontFamily}`);
      cssProps.push(`text-align: ${p.textAlign ?? 'left'}`);
      cssProps.push(`overflow: hidden`);
      cssRules.push(`.${className} {\n  ${cssProps.map(c => `  ${c};`).join('\n')}\n}`);
      const fieldName = p.fieldName || 'field';
      return `<span class="${className}">{{${fieldName}}}</span>`;
    }
    case 'ImageElement': {
      cssProps.push(`overflow: hidden`);
      cssRules.push(`.${className} {\n  ${cssProps.map(c => `  ${c};`).join('\n')}\n}`);
      if (p.isField && p.fieldName) {
        return `<img class="${className}" src="{{${p.fieldName}}}" alt="" style="width:100%;height:100%;object-fit:cover" />`;
      }
      return `<div class="${className}"><img src="${escHtml(p.src || '')}" alt="" style="width:100%;height:100%;object-fit:cover" /></div>`;
    }
    case 'ShapeElement': {
      if (p.borderRadius) cssProps.push(`border-radius: ${p.borderRadius}px`);
      if (p.borderWidth) cssProps.push(`border: ${p.borderWidth}px solid ${p.borderColor || '#000'}`);
      cssProps.push(`background: ${p.background || p.fill || '#333'}`);
      cssRules.push(`.${className} {
  ${cssProps.map(c => `  ${c};`).join('\n')}
}`);
      return `<div class="${className}">${childrenHtml}</div>`;
    }
    case 'CircleElement': {
      cssProps.push(`border-radius: 50%`);
      if (p.borderWidth) cssProps.push(`border: ${p.borderWidth}px solid ${p.borderColor || '#000'}`);
      cssProps.push(`background: ${p.background || '#444'}`);
      cssRules.push(`.${className} {
  ${cssProps.map(c => `  ${c};`).join('\n')}
}`);
      return `<div class="${className}">${childrenHtml}</div>`;
    }
    case 'LineElement': {
      cssProps.push(`display: flex; align-items: center; justify-content: center`);
      cssRules.push(`.${className} {
  ${cssProps.map(c => `  ${c};`).join('\n')}
}`);
      const lineColor = p.color || '#fff';
      const lineWidth = p.lineWidth || 2;
      return `<div class="${className}"><div style="width:100%;height:${lineWidth}px;background:${lineColor}"></div></div>`;
    }
    case 'ContainerElement': {
      if (p.borderRadius) cssProps.push(`border-radius: ${p.borderRadius}px`);
      if (p.borderWidth) cssProps.push(`border: ${p.borderWidth}px solid ${p.borderColor || 'rgba(255,255,255,0.2)'}`);
      cssProps.push(`background: ${p.background || 'rgba(255,255,255,0.1)'}`);
      if (p.padding) cssProps.push(`padding: ${p.padding}px`);
      cssProps.push(`box-sizing: border-box`);
      cssRules.push(`.${className} {
  ${cssProps.map(c => `  ${c};`).join('\n')}
}`);
      return `<div class="${className}">${childrenHtml}</div>`;
    }
    case 'IconElement': {
      cssProps.push(`display: flex; align-items: center; justify-content: center`);
      cssProps.push(`font-size: ${p.iconSize ?? 24}px`);
      cssProps.push(`color: ${p.color ?? '#fff'}`);
      cssRules.push(`.${className} {
  ${cssProps.map(c => `  ${c};`).join('\n')}
}`);
      return `<div class="${className}">${p.iconName || '?'}</div>`;
    }
    default: {
      cssRules.push(`.${className} {\n  ${cssProps.map(c => `  ${c};`).join('\n')}\n}`);
      return `<div class="${className}">${childrenHtml}</div>`;
    }
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function indent(s: string, level: number): string {
  const i = '  '.repeat(level);
  return s.split('\n').map(l => l.trim() ? `${i}${l}` : l).join('\n');
}
