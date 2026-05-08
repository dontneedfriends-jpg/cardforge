import { NodeMap } from './serializer';

interface ParsedElement {
  type: string;
  props: Record<string, any>;
  text?: string;
  children: ParsedElement[];
}

/**
 * Parse HTML+CSS template back into CraftJS nodes
 * This is a simplified parser that recognizes our element types
 */
export function templateToCraftState(html: string, css: string): NodeMap | null {
  try {
    // Extract elements from HTML
    const containerMatch = html.match(/<div class="card-root"\u003e([\s\S]*?)<\/div\u003e/);
    if (!containerMatch) return null;
    
    const innerHtml = containerMatch[1].trim();
    const elements = parseHtmlElements(innerHtml, css);
    
    if (elements.length === 0) return null;
    
    // Build CraftJS node map
    const nodes: NodeMap = {
      'ROOT': {
        type: { resolvedName: 'div' },
        props: {},
        nodes: ['canvas'],
        isCanvas: true,
      },
      'canvas': {
        type: { resolvedName: 'div' },
        props: {},
        nodes: [],
        isCanvas: true,
        displayName: 'Canvas',
      },
    };
    
    let nodeIndex = 0;
    for (const el of elements) {
      const nodeId = `node-${nodeIndex++}`;
      const node = createCraftNode(nodeId, el);
      nodes[nodeId] = node;
      nodes['canvas'].nodes.push(nodeId);
    }
    
    return nodes;
  } catch {
    return null;
  }
}

function parseHtmlElements(html: string, css: string): ParsedElement[] {
  const elements: ParsedElement[] = [];
  
  // Match div elements with class el-*
  const divRegex = /<div class="el-([^"]+)"\u003e([\s\S]*?)<\/div\u003e/g;
  let match;
  
  while ((match = divRegex.exec(html)) !== null) {
    const className = match[1];
    const content = match[2].trim();
    const cssRule = extractCssRule(css, className);
    
    const element = parseElementFromCss(className, cssRule, content, html);
    if (element) {
      elements.push(element);
    }
  }
  
  // Match span elements (for fields)
  const spanRegex = /<span class="el-([^"]+)"\u003e\{\{([^}]+)\}\}<\/span\u003e/g;
  while ((match = spanRegex.exec(html)) !== null) {
    const className = match[1];
    const fieldName = match[2];
    const cssRule = extractCssRule(css, className);
    
    const props = parseCssProperties(cssRule);
    elements.push({
      type: 'FieldBadge',
      props: {
        ...props,
        fieldName,
        fontSize: parseInt(props.fontSize) || 14,
        fontWeight: props.fontWeight || 'normal',
        color: props.color || '#ffffff',
        textAlign: props.textAlign || 'left',
      },
      children: [],
    });
  }
  
  // Match img elements
  const imgRegex = /<img class="el-([^"]+)" src="([^"]*)"[^/]*\/?\u003e/g;
  while ((match = imgRegex.exec(html)) !== null) {
    const className = match[1];
    const src = match[2];
    const cssRule = extractCssRule(css, className);
    const props = parseCssProperties(cssRule);
    
    const isField = src.startsWith('{{') && src.endsWith('}}');
    elements.push({
      type: 'ImageElement',
      props: {
        ...props,
        src: isField ? '' : src,
        isField,
        fieldName: isField ? src.slice(2, -2) : '',
      },
      children: [],
    });
  }
  
  return elements;
}

function extractCssRule(css: string, className: string): string {
  const regex = new RegExp(`\\.el-${className}\\s*\\{([^}]+)\\}`, 'i');
  const match = css.match(regex);
  return match ? match[1] : '';
}

function parseCssProperties(cssRule: string): Record<string, any> {
  const props: Record<string, any> = {};
  const declarations = cssRule.split(';').filter(d => d.trim());
  
  for (const decl of declarations) {
    const [prop, value] = decl.split(':').map(s => s.trim());
    if (!prop || !value) continue;
    
    switch (prop) {
      case 'left': props.x = parseInt(value); break;
      case 'top': props.y = parseInt(value); break;
      case 'width': props.width = parseInt(value); break;
      case 'height': props.height = parseInt(value); break;
      case 'transform': {
        const rot = value.match(/rotate\(([^)]+)\)/);
        if (rot) props.rotation = parseInt(rot[1]);
        break;
      }
      case 'opacity': props.opacity = parseFloat(value); break;
      case 'z-index': props.zIndex = parseInt(value); break;
      case 'display': {
        if (value === 'none') props.visible = false;
        break;
      }
      case 'font-size': props.fontSize = parseInt(value); break;
      case 'font-weight': props.fontWeight = value; break;
      case 'color': props.color = value; break;
      case 'font-family': props.fontFamily = value; break;
      case 'text-align': props.textAlign = value; break;
      case 'border-radius': {
        if (value.includes('%')) {
          props.borderRadius = value.trim();
        } else {
          props.borderRadius = parseInt(value);
        }
        break;
      }
      case 'padding': props.padding = parseInt(value); break;
      case 'box-sizing': props['box-sizing'] = value; break;
      case 'border': {
        const borderMatch = value.match(/(\d+)px\s+solid\s+(.+)/);
        if (borderMatch) {
          props.borderWidth = parseInt(borderMatch[1]);
          props.borderColor = borderMatch[2];
        }
        break;
      }
      case 'background': props.background = value; break;
    }
  }
  
  return props;
}

function parseElementFromCss(
  _className: string, 
  cssRule: string, 
  content: string,
  fullHtml: string
): ParsedElement | null {
  const props = parseCssProperties(cssRule);
  
  // Detect type from content and CSS
  if (content.includes('img') || fullHtml.includes(`class="el-${_className}"`)) {
    // Check if it's an image wrapper
    const imgMatch = content.match(/<img[^>]*src="([^"]*)"/);
    if (imgMatch) {
      const src = imgMatch[1];
      const isField = src.startsWith('{{') && src.endsWith('}}');
      return {
        type: 'ImageElement',
        props: {
          ...props,
          src: isField ? '' : src,
          isField,
          fieldName: isField ? src.slice(2, -2) : '',
        },
        children: [],
      };
    }
  }
  
  // Check for line (flex center with inner div of small height)
  if (props.display?.includes('flex') && content.includes('<div') && content.includes('height:')) {
    const lineMatch = content.match(/height:(\d+)px/);
    const colorMatch = content.match(/background:([^;]+)/);
    return {
      type: 'LineElement',
      props: {
        ...props,
        color: colorMatch ? colorMatch[1].trim() : '#fff',
        lineWidth: lineMatch ? parseInt(lineMatch[1]) : 2,
      },
      children: [],
    };
  }
  
  // Check for circle (border-radius: 50%)
  if (props.borderRadius === 50 || cssRule.includes('border-radius: 50%') || cssRule.includes('border-radius:50%')) {
    return {
      type: 'CircleElement',
      props: {
        ...props,
        background: props.background || '#444',
        borderWidth: props.borderWidth || 0,
        borderColor: props.borderColor || '#000',
      },
      children: [],
    };
  }
  
  // Check for container (has padding and box-sizing)
  if (props['box-sizing'] === 'border-box' && (props.padding !== undefined || cssRule.includes('padding:'))) {
    return {
      type: 'ContainerElement',
      props: {
        ...props,
        background: props.background || 'rgba(255,255,255,0.1)',
        borderRadius: props.borderRadius || 8,
        borderWidth: props.borderWidth || 1,
        borderColor: props.borderColor || 'rgba(255,255,255,0.2)',
        padding: props.padding || 8,
      },
      children: [],
    };
  }
  
  // Check for icon (single character/emoji in a flex center div)
  if (props.display?.includes('flex') && content.length <= 5 && !content.includes('<')) {
    return {
      type: 'IconElement',
      props: {
        ...props,
        iconName: content.trim(),
        iconSize: parseInt(props.fontSize) || 24,
      },
      children: [],
    };
  }
  
  // Check for text (simple text content)
  if (!content.includes('<') || content.match(/^\s*[^<>]+\s*$/)) {
    const text = content.replace(/<[^>]*>/g, '').trim();
    if (text) {
      return {
        type: 'TextElement',
        props: {
          ...props,
          text,
          fontSize: parseInt(props.fontSize) || 14,
          fontWeight: props.fontWeight || 'normal',
          color: props.color || '#ffffff',
          textAlign: props.textAlign || 'left',
        },
        text,
        children: [],
      };
    }
  }
  
  // Default to shape
  return {
    type: 'ShapeElement',
    props: {
      ...props,
      background: props.background || '#333',
    },
    children: [],
  };
}

function createCraftNode(_id: string, element: ParsedElement): any {
  const baseProps = {
    x: element.props.x ?? 0,
    y: element.props.y ?? 0,
    width: element.props.width ?? 200,
    height: element.props.height ?? 30,
    rotation: element.props.rotation ?? 0,
    opacity: element.props.opacity ?? 1,
    zIndex: element.props.zIndex ?? 0,
    visible: element.props.visible !== false,
  };
  
  switch (element.type) {
    case 'CircleElement':
      return {
        type: { resolvedName: 'CircleElement' },
        props: {
          ...baseProps,
          background: element.props.background || '#444',
          borderWidth: element.props.borderWidth || 0,
          borderColor: element.props.borderColor || '#000',
        },
        nodes: [],
        displayName: 'Circle',
      };
    case 'LineElement':
      return {
        type: { resolvedName: 'LineElement' },
        props: {
          ...baseProps,
          color: element.props.color || '#fff',
          lineWidth: element.props.lineWidth || 2,
        },
        nodes: [],
        displayName: 'Line',
      };
    case 'ContainerElement':
      return {
        type: { resolvedName: 'ContainerElement' },
        props: {
          ...baseProps,
          background: element.props.background || 'rgba(255,255,255,0.1)',
          borderRadius: element.props.borderRadius || 8,
          borderWidth: element.props.borderWidth || 1,
          borderColor: element.props.borderColor || 'rgba(255,255,255,0.2)',
          padding: element.props.padding || 8,
        },
        nodes: [],
        displayName: 'Container',
      };
    case 'TextElement':
      return {
        type: { resolvedName: 'TextElement' },
        props: {
          ...baseProps,
          text: element.props.text || 'Text',
          fontSize: element.props.fontSize || 14,
          fontWeight: element.props.fontWeight || 'normal',
          color: element.props.color || '#ffffff',
          fontFamily: element.props.fontFamily || '',
          textAlign: element.props.textAlign || 'left',
        },
        nodes: [],
        displayName: 'Text',
      };
      
    case 'FieldBadge':
      return {
        type: { resolvedName: 'FieldBadge' },
        props: {
          ...baseProps,
          fieldName: element.props.fieldName || 'name',
          fontSize: element.props.fontSize || 14,
          fontWeight: element.props.fontWeight || 'bold',
          color: element.props.color || '#ffffff',
          fontFamily: element.props.fontFamily || '',
          textAlign: element.props.textAlign || 'left',
        },
        nodes: [],
        displayName: 'Field',
      };
      
    case 'ImageElement':
      return {
        type: { resolvedName: 'ImageElement' },
        props: {
          ...baseProps,
          src: element.props.src || '',
          fieldName: element.props.fieldName || '',
          isField: element.props.isField || false,
        },
        nodes: [],
        displayName: 'Image',
      };
      
    case 'ShapeElement':
      return {
        type: { resolvedName: 'ShapeElement' },
        props: {
          ...baseProps,
          background: element.props.background || '#444',
          fill: element.props.fill || '',
          borderRadius: element.props.borderRadius || 0,
          borderWidth: element.props.borderWidth || 0,
          borderColor: element.props.borderColor || '#000',
        },
        nodes: [],
        displayName: 'Shape',
      };
      
    case 'IconElement':
      return {
        type: { resolvedName: 'IconElement' },
        props: {
          ...baseProps,
          iconName: element.props.iconName || 'star',
          iconSize: element.props.iconSize || 24,
          color: element.props.color || '#ffffff',
        },
        nodes: [],
        displayName: 'Icon',
      };
      
    default:
      return {
        type: { resolvedName: 'div' },
        props: baseProps,
        nodes: [],
        displayName: 'Element',
      };
  }
}
