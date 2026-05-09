import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCanvasStore, useEditorStore } from '../../store';

export function useGlobalHotkeys() {
  const navigate = useNavigate();

  useEffect(() => {
    const isMonacoFocused = () => {
      const el = document.activeElement;
      return el?.closest('.monaco-editor') !== null;
    };

    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Skip canvas undo/redo if Monaco is focused (Monaco has its own undo/redo)
      if (isMonacoFocused()) return;

      // Ctrl+Z — undo (visual editor)
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        if (isInput) return;
        e.preventDefault();
        useCanvasStore.getState().undo();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y — redo
      if ((ctrl && e.key === 'y') || (ctrl && e.key === 'z' && e.shiftKey)) {
        if (isInput) return;
        e.preventDefault();
        useCanvasStore.getState().redo();
        return;
      }

      // Ctrl+S — save (already handled by useSaveHotkey, but we also handle editorStore)
      if (ctrl && e.key === 's') {
        const editorState = useEditorStore.getState();
        if (editorState.isDirty && editorState.currentDeckPath) {
          e.preventDefault();
          editorState.saveTemplate();
        }
        return;
      }

      // F5 — simulator
      if (e.key === 'F5') {
        e.preventDefault();
        navigate({ to: '/simulator' });
        return;
      }

      // Ctrl+E — export
      if (ctrl && e.key === 'e') {
        e.preventDefault();
        navigate({ to: '/export' });
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
}
