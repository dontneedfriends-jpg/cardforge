import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { useProjectStore, useUiStore, useEditorStore, useDeckStore } from './store';
import { useEffect, useState } from 'react';
import { loadFontsIntoDocument } from './shared/utils/fontUtils';
import { invoke } from '@tauri-apps/api/core';
import { CrashRecoveryDialog } from './shared/components/CrashRecoveryDialog';

interface SessionState {
  activeDeckId: string;
  activeBoardId: string;
  editorMode: string;
  activeTab: string;
  sidebarTab: string;
  previewCardIndex: number;
  cleanShutdown: boolean;
  lastActiveTimestamp: string;
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function collectSession(cleanShutdown: boolean): SessionState {
  const editor = useEditorStore.getState();
  const deck = useDeckStore.getState();
  const ui = useUiStore.getState();
  return {
    activeDeckId: deck.activeDeckId || '',
    activeBoardId: editor.activeBoardId || '',
    editorMode: editor.editorMode || 'code',
    activeTab: editor.activeTab || 'html',
    sidebarTab: ui.sidebarTab || 'decks',
    previewCardIndex: editor.previewCardIndex ?? 0,
    cleanShutdown,
    lastActiveTimestamp: new Date().toISOString(),
  };
}

export default function App() {
  const projectPath = useProjectStore((s) => s.projectPath);
  const openProject = useProjectStore((s) => s.openProject);
  const theme = useUiStore((s) => s.theme);
  const [recoveryData, setRecoveryData] = useState<{ projectPath: string; lastActive: string; deckName: string } | null>(null);

  useEffect(() => {
    if (projectPath) {
      openProject(projectPath).catch(() => {
        console.warn('[App] Failed to open project');
      });
    }
  }, [projectPath]);

  useEffect(() => {
    if (projectPath) {
      loadFontsIntoDocument(projectPath).catch(() => {
        console.warn('[App] Failed to load fonts');
      });
    }
  }, [projectPath]);

  // Crash recovery: check for unclean shutdown when project opens
  useEffect(() => {
    if (!projectPath) return;
    let cancelled = false;

    const check = async () => {
      for (let i = 0; i < 30; i++) {
        if (cancelled) return;
        if (useProjectStore.getState().manifest) break;
        await new Promise(r => setTimeout(r, 100));
      }
      if (cancelled) return;

      try {
        const session = await invoke<SessionState>('read_session', { projectPath });
        if (session.cleanShutdown || (!session.activeDeckId && !session.activeBoardId)) return;

        const manifest = useProjectStore.getState().manifest;
        const deck = manifest?.decks.find(d => d.id === session.activeDeckId);
        const board = manifest?.boards.find(b => b.id === session.activeBoardId);
        setRecoveryData({
          projectPath,
          lastActive: session.lastActiveTimestamp,
          deckName: deck?.name || board?.name || '',
        });
      } catch {}
    };

    check();
    return () => { cancelled = true; };
  }, [projectPath]);

  // Periodic session save
  useEffect(() => {
    if (!projectPath) return;
    const save = () => invoke('write_session', { projectPath, session: collectSession(false) });
    save();
    const interval = setInterval(save, 15000);
    return () => {
      clearInterval(interval);
      invoke('write_session', { projectPath, session: collectSession(true) });
    };
  }, [projectPath]);

  // beforeunload — best-effort clean shutdown marker
  useEffect(() => {
    if (!projectPath) return;
    const onUnload = () => invoke('write_session', { projectPath, session: collectSession(true) });
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [projectPath]);

  // Theme + system changes listener
  useEffect(() => {
    const apply = () => {
      const resolved = theme === 'system' ? getSystemTheme() : theme;
      document.body.setAttribute('data-theme', resolved);
    };
    apply();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener?.('change', apply);
      return () => mq.removeEventListener?.('change', apply);
    }
  }, [theme]);

  // Font size & Density
  const fontSize = useUiStore((s) => s.fontSize);
  const density = useUiStore((s) => s.density);
  useEffect(() => {
    document.body.setAttribute('data-font-size', fontSize);
    document.body.setAttribute('data-density', density);
  }, [fontSize, density]);

  const handleRecover = async () => {
    if (!recoveryData) return;
    try {
      const session = await invoke<SessionState>('read_session', { projectPath: recoveryData.projectPath });
      const manifest = useProjectStore.getState().manifest;
      if (!projectPath) return;

      if (session.activeDeckId) {
        const deck = manifest?.decks.find(d => d.id === session.activeDeckId);
        if (deck) {
          useDeckStore.getState().setActiveDeck(session.activeDeckId);
          const fullPath = `${projectPath}/${deck.path}`;
          await useEditorStore.getState().loadTemplate(fullPath);
          await useDeckStore.getState().loadData(fullPath, deck);
          await useEditorStore.getState().loadCardBack(fullPath);
        }
      } else if (session.activeBoardId) {
        const board = manifest?.boards.find(b => b.id === session.activeBoardId);
        if (board) {
          useEditorStore.getState().setActiveBoard(session.activeBoardId);
          const fullPath = `${projectPath}/${board.path}`;
          await useEditorStore.getState().loadTemplate(fullPath);
        }
      }

      useUiStore.getState().setSidebarTab(session.sidebarTab || 'decks');
    } catch {}
    setRecoveryData(null);
  };

  return (
    <>
      <RouterProvider router={router} />
      <CrashRecoveryDialog
        open={!!recoveryData}
        projectPath={recoveryData?.projectPath || ''}
        lastActive={recoveryData?.lastActive || ''}
        deckName={recoveryData?.deckName || ''}
        onRecover={handleRecover}
        onDismiss={() => setRecoveryData(null)}
      />
    </>
  );
}
