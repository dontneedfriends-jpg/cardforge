import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ElementType = 'text' | 'image' | 'shape' | 'circle' | 'line' | 'icon' | 'field' | 'container' | 'qr';

export interface TextElementProps {
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  fontFamily?: string;
  textAlign?: string;
  textStroke?: number;
  textStrokeColor?: string;
  textShadow?: string;
  fieldName?: string;
}

export interface ImageElementProps {
  src?: string;
  fieldName?: string;
  isField?: boolean;
}

export interface ShapeElementProps {
  background?: string;
  fill?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

export interface CircleElementProps {
  background?: string;
  borderWidth?: number;
  borderColor?: string;
}

export interface LineElementProps {
  color?: string;
  lineWidth?: number;
}

export interface IconElementProps {
  iconName?: string;
  iconSize?: number;
  color?: string;
}

export interface QrElementProps {
  data?: string;
  qrSize?: number;
  color?: string;
  bgColor?: string;
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
}

export interface ContainerElementProps {
  background?: string;
  fill?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  padding?: number;
  layout?: 'free' | 'grid' | 'stack';
  columns?: number;
  rows?: number;
  gap?: number;
  direction?: string;
  alignItems?: string;
  justifyContent?: string;
  rawHtml?: string;
  rawCss?: string;
  childrenIds?: string[];
}

export type ElementProps = Partial<
  TextElementProps &
  ImageElementProps &
  ShapeElementProps &
  CircleElementProps &
  LineElementProps &
  IconElementProps &
  QrElementProps &
  ContainerElementProps
>;

export interface CanvasElementMeta {
  sourceHtml?: string;
  sourceSelector?: string;
  tagName?: string;
  classList?: string[];
  inlineStyle?: string;
  customAttrs?: Record<string, string>;
  cfId?: string;
}

export type ElementPropsByType = {
  text: Partial<TextElementProps>;
  field: Partial<TextElementProps>;
  image: Partial<ImageElementProps>;
  shape: Partial<ShapeElementProps>;
  circle: Partial<CircleElementProps>;
  line: Partial<LineElementProps>;
  icon: Partial<IconElementProps>;
  qr: Partial<QrElementProps>;
  container: Partial<ContainerElementProps>;
};

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  props: ElementProps;
  meta?: CanvasElementMeta;
  parentId?: string;
}

export interface Guide {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number;
}

export interface ElementPreset {
  id: string;
  name: string;
  type: ElementType;
  props: ElementProps;
}

interface CanvasState {
  elements: CanvasElement[];
  selectedId: string | null;
  selectedIds: string[];
  past: CanvasElement[][];
  future: CanvasElement[][];
  clipboard: CanvasElement | null;
  zoom: number;
  guides: Guide[];
  presets: ElementPreset[];
}

interface CanvasActions {
  addElement: (element: Omit<CanvasElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateElementProps: (id: string, props: Partial<ElementProps>) => void;
  deleteElement: (id: string) => void;
  deleteSelected: () => void;
  selectElement: (id: string | null) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  moveElement: (id: string, x: number, y: number) => void;
  moveSelected: (dx: number, dy: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
  reorderElement: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  duplicateElement: (id: string) => void;
  duplicateSelected: () => void;
  setElements: (elements: CanvasElement[]) => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  copyElement: (id: string) => void;
  copySelected: () => void;
  pasteElement: () => void;
  setZoom: (zoom: number) => void;
  alignElements: (align: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distributeH' | 'distributeV') => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  addGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
  removeGuide: (id: string) => void;
  clearGuides: () => void;
  savePreset: (name: string) => void;
  applyPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
}

type CanvasStore = CanvasState & CanvasActions;

let idCounter = 0;
const generateId = () => `el_${Date.now()}_${++idCounter}`;
const MAX_HISTORY = 50;

function snapshot(elements: CanvasElement[]): CanvasElement[] {
  return JSON.parse(JSON.stringify(elements));
}

export const useCanvasStore = create<CanvasStore>()(
  immer((set) => ({
    elements: [],
    selectedId: null,
    selectedIds: [],
    past: [],
    future: [],
    clipboard: null,
    zoom: 1,
    guides: [],
    presets: [],

    addElement: (element) => {
      set((state) => {
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        const newElement: CanvasElement = {
          ...element,
          id: generateId(),
          zIndex: state.elements.length,
        };
        state.elements.push(newElement);
        state.selectedId = newElement.id;
        state.selectedIds = [newElement.id];
      });
    },

    updateElement: (id, updates) => {
      set((state) => {
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        const el = state.elements.find((e) => e.id === id);
        if (el) {
          Object.assign(el, updates);
        }
      });
    },

    updateElementProps: (id, props) => {
      set((state) => {
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        const el = state.elements.find((e) => e.id === id);
        if (el) {
          Object.assign(el.props, props);
        }
      });
    },

    deleteElement: (id) => {
      set((state) => {
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        state.elements = state.elements.filter((e) => e.id !== id);
        state.selectedIds = state.selectedIds.filter((sid) => sid !== id);
        if (state.selectedId === id) {
          state.selectedId = state.selectedIds.length > 0 ? state.selectedIds[state.selectedIds.length - 1] : null;
        }
      });
    },

    deleteSelected: () => {
      set((state) => {
        if (state.selectedIds.length === 0) return;
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        state.elements = state.elements.filter((e) => !state.selectedIds.includes(e.id));
        state.selectedIds = [];
        state.selectedId = null;
      });
    },

    selectElement: (id) => {
      set((state) => {
        state.selectedId = id;
        state.selectedIds = id ? [id] : [];
      });
    },

    toggleSelection: (id) => {
      set((state) => {
        const idx = state.selectedIds.indexOf(id);
        if (idx === -1) {
          state.selectedIds.push(id);
          state.selectedId = id;
        } else {
          state.selectedIds.splice(idx, 1);
          state.selectedId = state.selectedIds.length > 0 ? state.selectedIds[state.selectedIds.length - 1] : null;
        }
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedId = null;
        state.selectedIds = [];
      });
    },

    moveElement: (id, x, y) => {
      set((state) => {
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        const el = state.elements.find((e) => e.id === id);
        if (el) {
          el.x = x;
          el.y = y;
        }
      });
    },

    moveSelected: (dx, dy) => {
      set((state) => {
        if (state.selectedIds.length === 0) return;
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        state.selectedIds.forEach((id) => {
          const el = state.elements.find((e) => e.id === id);
          if (el) {
            el.x += dx;
            el.y += dy;
          }
        });
      });
    },

    resizeElement: (id, width, height) => {
      set((state) => {
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        const el = state.elements.find((e) => e.id === id);
        if (el) {
          el.width = width;
          el.height = height;
        }
      });
    },

    reorderElement: (id, direction) => {
      set((state) => {
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        const idx = state.elements.findIndex((e) => e.id === id);
        if (idx === -1) return;

        const el = state.elements[idx];
        switch (direction) {
          case 'up':
            el.zIndex = Math.max(0, el.zIndex + 1);
            break;
          case 'down':
            el.zIndex = Math.max(0, el.zIndex - 1);
            break;
          case 'top':
            el.zIndex = state.elements.length;
            break;
          case 'bottom':
            el.zIndex = 0;
            break;
        }
      });
    },

    duplicateElement: (id) => {
      set((state) => {
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        const el = state.elements.find((e) => e.id === id);
        if (el) {
          const newEl: CanvasElement = {
            ...el,
            id: generateId(),
            x: el.x + 20,
            y: el.y + 20,
            zIndex: state.elements.length,
          };
          state.elements.push(newEl);
          state.selectedId = newEl.id;
          state.selectedIds = [newEl.id];
        }
      });
    },

    duplicateSelected: () => {
      set((state) => {
        if (state.selectedIds.length === 0) return;
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        const newIds: string[] = [];
        state.selectedIds.forEach((id) => {
          const el = state.elements.find((e) => e.id === id);
          if (el) {
            const newEl: CanvasElement = {
              ...el,
              id: generateId(),
              x: el.x + 20,
              y: el.y + 20,
              zIndex: state.elements.length + newIds.length,
            };
            state.elements.push(newEl);
            newIds.push(newEl.id);
          }
        });
        state.selectedIds = newIds;
        state.selectedId = newIds.length > 0 ? newIds[newIds.length - 1] : null;
      });
    },

    setElements: (elements) => {
      set((state) => {
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        state.elements = elements;
      });
    },

    clearCanvas: () => {
      set((state) => {
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        state.elements = [];
        state.selectedId = null;
        state.selectedIds = [];
      });
    },

    undo: () => {
      set((state) => {
        if (state.past.length === 0) return;
        state.future.push(snapshot(state.elements));
        if (state.future.length > MAX_HISTORY) state.future.shift();
        state.elements = state.past.pop()!;
      });
    },

    redo: () => {
      set((state) => {
        if (state.future.length === 0) return;
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.elements = state.future.pop()!;
      });
    },

    copyElement: (id) => {
      set((state) => {
        const el = state.elements.find((e) => e.id === id);
        if (el) {
          state.clipboard = snapshot([el])[0];
        }
      });
    },

    copySelected: () => {
      set((state) => {
        if (state.selectedIds.length === 0) return;
        const el = state.elements.find((e) => e.id === state.selectedId);
        if (el) {
          state.clipboard = snapshot([el])[0];
        }
      });
    },

    pasteElement: () => {
      set((state) => {
        if (!state.clipboard) return;
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        const cloned = snapshot([state.clipboard])[0];
        const newEl: CanvasElement = {
          ...cloned,
          id: generateId(),
          x: cloned.x + 20,
          y: cloned.y + 20,
          zIndex: state.elements.length,
        };
        state.elements.push(newEl);
        state.selectedId = newEl.id;
        state.selectedIds = [newEl.id];
      });
    },

    setZoom: (zoom) => {
      set((state) => {
        state.zoom = Math.max(0.25, Math.min(3, zoom));
      });
    },

    alignElements: (align) => {
      set((state) => {
        if (state.selectedIds.length < 2) return;
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];

        const selected = state.elements.filter((e) => state.selectedIds.includes(e.id));

        switch (align) {
          case 'left': {
            const minX = Math.min(...selected.map((e) => e.x));
            selected.forEach((e) => { e.x = minX; });
            break;
          }
          case 'center': {
            const centerX = selected.map((e) => e.x + e.width / 2);
            const avgCenter = centerX.reduce((a, b) => a + b, 0) / centerX.length;
            selected.forEach((e) => { e.x = avgCenter - e.width / 2; });
            break;
          }
          case 'right': {
            const maxRight = Math.max(...selected.map((e) => e.x + e.width));
            selected.forEach((e) => { e.x = maxRight - e.width; });
            break;
          }
          case 'top': {
            const minY = Math.min(...selected.map((e) => e.y));
            selected.forEach((e) => { e.y = minY; });
            break;
          }
          case 'middle': {
            const centerY = selected.map((e) => e.y + e.height / 2);
            const avgCenterY = centerY.reduce((a, b) => a + b, 0) / centerY.length;
            selected.forEach((e) => { e.y = avgCenterY - e.height / 2; });
            break;
          }
          case 'bottom': {
            const maxBottom = Math.max(...selected.map((e) => e.y + e.height));
            selected.forEach((e) => { e.y = maxBottom - e.height; });
            break;
          }
          case 'distributeH': {
            const sorted = [...selected].sort((a, b) => a.x - b.x);
            const totalW = sorted.reduce((sum, e) => sum + e.width, 0);
            const firstX = sorted[0].x;
            const lastX = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
            const gap = (lastX - firstX - totalW) / (sorted.length - 1);
            let cursor = firstX;
            sorted.forEach((e) => {
              e.x = cursor;
              cursor += e.width + gap;
            });
            break;
          }
          case 'distributeV': {
            const sorted = [...selected].sort((a, b) => a.y - b.y);
            const totalH = sorted.reduce((sum, e) => sum + e.height, 0);
            const firstY = sorted[0].y;
            const lastY = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
            const gap = (lastY - firstY - totalH) / (sorted.length - 1);
            let cursor = firstY;
            sorted.forEach((e) => {
              e.y = cursor;
              cursor += e.height + gap;
            });
            break;
          }
        }
      });
    },

    groupSelected: () => {
      set((state) => {
        if (state.selectedIds.length < 2) return;
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];

        const selected = state.elements.filter((e) => state.selectedIds.includes(e.id));
        const minX = Math.min(...selected.map((e) => e.x));
        const minY = Math.min(...selected.map((e) => e.y));
        const maxX = Math.max(...selected.map((e) => e.x + e.width));
        const maxY = Math.max(...selected.map((e) => e.y + e.height));

        const groupId = generateId();
        const childrenIds = selected.map((e) => e.id);

        selected.forEach((e) => {
          e.parentId = groupId;
          e.x -= minX;
          e.y -= minY;
        });

        const groupEl: CanvasElement = {
          id: groupId,
          type: 'container',
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          rotation: 0,
          opacity: 1,
          zIndex: state.elements.length,
          visible: true,
          props: {
            background: 'rgba(96,205,255,0.05)',
            borderRadius: 4,
            borderWidth: 1,
            borderColor: 'rgba(96,205,255,0.3)',
            padding: 0,
            childrenIds,
          },
        };
        state.elements.push(groupEl);
        state.selectedId = groupId;
        state.selectedIds = [groupId];
      });
    },

    ungroupSelected: () => {
      set((state) => {
        if (state.selectedIds.length === 0) return;
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];

        const containers = state.elements.filter(
          (e) => state.selectedIds.includes(e.id) && e.type === 'container' &&
            (((e.props.childrenIds?.length ?? 0) > 0) || state.elements.some((c) => c.parentId === e.id))
        );

        containers.forEach((container) => {
          const parentX = container.x;
          const parentY = container.y;
          const childIds = (container.props?.childrenIds as string[] | undefined) ?? [];
          state.elements.forEach((child) => {
            if (child.parentId === container.id && (childIds.length === 0 || childIds.includes(child.id))) {
              child.parentId = undefined;
              child.x += parentX;
              child.y += parentY;
            }
          });
          state.elements = state.elements.filter((e) => e.id !== container.id);
        });

        state.selectedIds = [];
        state.selectedId = null;
      });
    },

    addGuide: (orientation, position) => {
      set((state) => {
        const id = `guide_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        state.guides.push({ id, orientation, position });
      });
    },

    removeGuide: (id) => {
      set((state) => {
        state.guides = state.guides.filter((g) => g.id !== id);
      });
    },

    clearGuides: () => {
      set((state) => {
        state.guides = [];
      });
    },

    savePreset: (name) => {
      set((state) => {
        const el = state.elements.find((e) => e.id === state.selectedId);
        if (!el) return;
        const preset: ElementPreset = {
          id: `preset_${Date.now()}`,
          name,
          type: el.type,
          props: JSON.parse(JSON.stringify(el.props)),
        };
        // Replace if same name exists
        const existing = state.presets.findIndex((p) => p.name === name);
        if (existing !== -1) {
          state.presets[existing] = preset;
        } else {
          state.presets.push(preset);
        }
      });
    },

    applyPreset: (presetId) => {
      set((state) => {
        const preset = state.presets.find((p) => p.id === presetId);
        if (!preset) return;
        const el = state.elements.find((e) => e.id === state.selectedId);
        if (!el || el.type !== preset.type) return;
        state.past.push(snapshot(state.elements));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        Object.assign(el.props, JSON.parse(JSON.stringify(preset.props)));
      });
    },

    deletePreset: (presetId) => {
      set((state) => {
        state.presets = state.presets.filter((p) => p.id !== presetId);
      });
    },
  }))
);
