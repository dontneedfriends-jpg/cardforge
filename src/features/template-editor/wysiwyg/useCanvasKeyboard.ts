import { useEffect } from 'react';
import type { CanvasElement } from '../../../store/canvasStore';

interface KeyboardDeps {
  elements: CanvasElement[];
  selectedId: string | null;
  selectedIds: string[];
  zoom: number;
  selectElement: (id: string) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  moveElement: (id: string, x: number, y: number) => void;
  undo: () => void;
  redo: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteElement: () => void;
  setZoom: (zoom: number) => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  syncIfVisual: () => void;
}

export function useCanvasKeyboard(deps: KeyboardDeps): void {
  const {
    elements, selectedId, selectedIds, zoom,
    selectElement, clearSelection, deleteSelected, moveElement,
    undo, redo, duplicateSelected, copySelected, pasteElement,
    setZoom, groupSelected, ungroupSelected, syncIfVisual,
  } = deps;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const step = e.shiftKey ? 10 : 1;

      switch (e.key) {
        case 'Tab': {
          e.preventDefault();
          const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
          const idx = sorted.findIndex((el) => el.id === selectedId);
          const next = e.shiftKey
            ? sorted[(idx - 1 + sorted.length) % sorted.length]
            : sorted[(idx + 1) % sorted.length];
          if (next) selectElement(next.id);
          break;
        }
        case 'Escape':
          if (selectedId) { clearSelection(); }
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedIds.length > 0) {
            e.preventDefault();
            deleteSelected();
            syncIfVisual();
          }
          break;
        case 'ArrowUp':
          if (selectedIds.length > 0) {
            e.preventDefault();
            if (selectedIds.length === 1) {
              const el = elements.find((x) => x.id === selectedId);
              if (el) moveElement(selectedId!, el.x, el.y - step);
            } else {
              selectedIds.forEach((id) => {
                const el = elements.find((x) => x.id === id);
                if (el) moveElement(id, el.x, el.y - step);
              });
            }
            syncIfVisual();
          }
          break;
        case 'ArrowDown':
          if (selectedIds.length > 0) {
            e.preventDefault();
            if (selectedIds.length === 1) {
              const el = elements.find((x) => x.id === selectedId);
              if (el) moveElement(selectedId!, el.x, el.y + step);
            } else {
              selectedIds.forEach((id) => {
                const el = elements.find((x) => x.id === id);
                if (el) moveElement(id, el.x, el.y + step);
              });
            }
            syncIfVisual();
          }
          break;
        case 'ArrowLeft':
          if (selectedIds.length > 0) {
            e.preventDefault();
            if (selectedIds.length === 1) {
              const el = elements.find((x) => x.id === selectedId);
              if (el) moveElement(selectedId!, el.x - step, el.y);
            } else {
              selectedIds.forEach((id) => {
                const el = elements.find((x) => x.id === id);
                if (el) moveElement(id, el.x - step, el.y);
              });
            }
            syncIfVisual();
          }
          break;
        case 'ArrowRight':
          if (selectedIds.length > 0) {
            e.preventDefault();
            if (selectedIds.length === 1) {
              const el = elements.find((x) => x.id === selectedId);
              if (el) moveElement(selectedId!, el.x + step, el.y);
            } else {
              selectedIds.forEach((id) => {
                const el = elements.find((x) => x.id === id);
                if (el) moveElement(id, el.x + step, el.y);
              });
            }
            syncIfVisual();
          }
          break;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            syncIfVisual();
            break;
          case 'y':
            e.preventDefault();
            redo();
            syncIfVisual();
            break;
          case 'd':
            e.preventDefault();
            if (selectedIds.length > 0) {
              duplicateSelected();
              syncIfVisual();
            }
            break;
          case 'c':
            e.preventDefault();
            if (selectedIds.length > 0) {
              copySelected();
            }
            break;
          case 'v':
            e.preventDefault();
            pasteElement();
            syncIfVisual();
            break;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setZoom(zoom + 0.1);
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom(zoom - 0.1);
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
        } else if (e.key === 'g' && !e.shiftKey) {
          e.preventDefault();
          if (selectedIds.length >= 2) groupSelected();
        } else if (e.key === 'g' && e.shiftKey) {
          e.preventDefault();
          if (selectedIds.length > 0) ungroupSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, selectedId, selectedIds, zoom, selectElement, clearSelection, deleteSelected, moveElement, undo, redo, duplicateSelected, copySelected, pasteElement, setZoom, groupSelected, ungroupSelected, syncIfVisual]);
}
