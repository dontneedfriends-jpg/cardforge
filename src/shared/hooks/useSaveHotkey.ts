import { useEffect } from 'react';
import { useEditorStore, useDeckStore } from '../../store';

export function useSaveHotkey() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const editorStore = useEditorStore.getState();
        const deckStore = useDeckStore.getState();
        if (editorStore.isDirty) {
          editorStore.saveTemplate();
        }
        if (deckStore.deckData) {
          deckStore.saveData();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
