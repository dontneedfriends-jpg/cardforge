import { Group, Panel, Separator } from 'react-resizable-panels';
import { TemplateEditor } from '../template-editor/TemplateEditor';
import { DataEditor } from '../data-editor/DataEditor';
import { PreviewPanel } from '../preview/PreviewPanel';
import { AssetManager } from '../assets/AssetManager';
import { OverviewPage } from '../overview/OverviewPage';
import { useUiStore, useProjectStore } from '../../store';
import { useSaveHotkey } from '../../shared/hooks/useSaveHotkey';
import { useFileWatcher } from '../../shared/hooks/useFileWatcher';
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function EditorPage() {
  const sidebarTab = useUiStore((s) => s.sidebarTab);
  const projectPath = useProjectStore((s) => s.projectPath);
  useSaveHotkey();
  useFileWatcher();

  useEffect(() => {
    if (projectPath) {
      invoke('start_watch', { path: projectPath }).catch(() => {});
    }
    return () => { invoke('stop_watch').catch(() => {}); };
  }, [projectPath]);

  const centerPanel = (() => {
    switch (sidebarTab) {
      case 'data': return <DataEditor />;
      case 'assets': return <AssetManager />;
      case 'overview': return <OverviewPage />;
      default: return <TemplateEditor />;
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
