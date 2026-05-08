import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { useEditorStore, useDeckStore } from '../../store';

export function useFileWatcher() {
  useEffect(() => {
    const unlisten = listen<{ path: string; kind: string }>('file-changed', (event) => {
      const { path } = event.payload;
      const store = useEditorStore.getState();
      const deckStore = useDeckStore.getState();

      if (!store.currentDeckPath) return;

      if (path.endsWith('.html') || path.endsWith('.css')) {
        store.loadTemplate(store.currentDeckPath);
      }
      if (path.endsWith('.csv') && deckStore.deckData) {
        deckStore.loadData(store.currentDeckPath, deckStore.deckData.meta);
      }
    });

    return () => { unlisten.then(fn => fn()); };
  }, []);
}
