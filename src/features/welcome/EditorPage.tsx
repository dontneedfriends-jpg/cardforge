import { Group, Panel, Separator } from 'react-resizable-panels';
import { TemplateEditor } from '../template-editor/TemplateEditor';
import { DataEditor } from '../data-editor/DataEditor';
import { PreviewPanel } from '../preview/PreviewPanel';
import { AssetManager } from '../assets/AssetManager';
import { OverviewPage } from '../overview/OverviewPage';
import { useUiStore, useProjectStore, useDeckStore, useEditorStore } from '../../store';
import { useSaveHotkey } from '../../shared/hooks/useSaveHotkey';
import { useFileWatcher } from '../../shared/hooks/useFileWatcher';
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function EditorPage() {
  const sidebarTab = useUiStore((s) => s.sidebarTab);
  const projectPath = useProjectStore((s) => s.projectPath);
  const activeDeckId = useDeckStore((s) => s.activeDeckId);
  const activeBoardId = useEditorStore((s) => s.activeBoardId);
  useSaveHotkey();
  useFileWatcher();

  useEffect(() => {
    if (projectPath) {
      invoke('start_watch', { path: projectPath }).catch((e) => console.warn('[Editor] Failed to start file watch:', e));
    }
    return () => { invoke('stop_watch').catch((e) => console.warn('[Editor] Failed to stop file watch:', e)); };
  }, [projectPath]);

  const centerPanel = (() => {
    switch (sidebarTab) {
      case 'data': return <DataEditor />;
      case 'assets': return <AssetManager />;
      case 'overview': return <OverviewPage />;
      default: return (activeDeckId || activeBoardId) ? <TemplateEditor /> : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--mica-text-tertiary)', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '48px' }}>🃏</span>
          <span style={{ fontSize: '18px', fontWeight: 600 }}>No deck selected</span>
          <span>Create or open a deck from the sidebar to start editing</span>
        </div>
      );
    }
  })();

  return (
    <Group 
      orientation="horizontal" 
      style={{ height: '100%' }} 
      resizeTargetMinimumSize={{ coarse: 30, fine: 20 }}
    >
      <Panel id="center" defaultSize={70} minSize={30}>
        <div className="editor-center-panel">
          {centerPanel}
        </div>
      </Panel>
      
      <Separator id="sep-right" className="editor-separator" />
      
      <Panel id="right" defaultSize={30} minSize={20}>
        <div className="editor-preview-panel">
          <PreviewPanel />
        </div>
      </Panel>
    </Group>
  );
}
