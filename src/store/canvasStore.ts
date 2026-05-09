import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ElementType = 'text' | 'image' | 'shape' | 'circle' | 'line' | 'icon' | 'field' | 'container';

export interface CanvasElementMeta {
  sourceHtml?: string;
  sourceSelector?: string;
  tagName?: string;
  classList?: string[];
  inlineStyle?: string;
  customAttrs?: Record<string, string>;
  cfId?: string;
}

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
  props: Record<string, any>;
  meta?: CanvasElementMeta;
}

interface CanvasState {
  elements: CanvasElement[];
  selectedId: string | null;
  selectedIds: string[];
  past: CanvasElement[][];
  future: CanvasElement[][];
  clipboard: CanvasElement | null;
  zoom: number;
}

interface CanvasActions {
  addElement: (element: Omit<CanvasElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateElementProps: (id: string, props: Record<string, any>) => void;
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
        const newEl: CanvasElement = {
          ...state.clipboard,
          id: generateId(),
          x: state.clipboard.x + 20,
          y: state.clipboard.y + 20,
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
  }))
);
