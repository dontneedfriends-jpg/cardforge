import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ElementType = 'text' | 'image' | 'shape' | 'circle' | 'line' | 'icon' | 'field' | 'container';

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
}

interface CanvasState {
  elements: CanvasElement[];
  selectedId: string | null;
  past: CanvasElement[][];
  future: CanvasElement[][];
}

interface CanvasActions {
  addElement: (element: Omit<CanvasElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateElementProps: (id: string, props: Record<string, any>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
  reorderElement: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  duplicateElement: (id: string) => void;
  setElements: (elements: CanvasElement[]) => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
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
    past: [],
    future: [],

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
        if (state.selectedId === id) {
          state.selectedId = null;
        }
      });
    },

    selectElement: (id) => {
      set((state) => {
        state.selectedId = id;
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
        }
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
  }))
);
