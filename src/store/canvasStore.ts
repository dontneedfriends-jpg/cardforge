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
}

type CanvasStore = CanvasState & CanvasActions;

let idCounter = 0;
const generateId = () => `el_${Date.now()}_${++idCounter}`;

export const useCanvasStore = create<CanvasStore>()(
  immer((set) => ({
    elements: [],
    selectedId: null,

    addElement: (element) => {
      set((state) => {
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
        const el = state.elements.find((e) => e.id === id);
        if (el) {
          Object.assign(el, updates);
        }
      });
    },

    updateElementProps: (id, props) => {
      set((state) => {
        const el = state.elements.find((e) => e.id === id);
        if (el) {
          Object.assign(el.props, props);
        }
      });
    },

    deleteElement: (id) => {
      set((state) => {
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
        const el = state.elements.find((e) => e.id === id);
        if (el) {
          el.x = x;
          el.y = y;
        }
      });
    },

    resizeElement: (id, width, height) => {
      set((state) => {
        const el = state.elements.find((e) => e.id === id);
        if (el) {
          el.width = width;
          el.height = height;
        }
      });
    },

    reorderElement: (id, direction) => {
      set((state) => {
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
        state.elements = elements;
      });
    },

    clearCanvas: () => {
      set((state) => {
        state.elements = [];
        state.selectedId = null;
      });
    },
  }))
);
