import { Group, Panel, Separator } from 'react-resizable-panels';
import { ProjectSidebar } from '../project/ProjectSidebar';
import { TemplateEditor } from '../template-editor/TemplateEditor';
import { DataEditor } from '../data-editor/DataEditor';
import { PreviewPanel } from '../preview/PreviewPanel';
import { AssetManager } from '../assets/AssetManager';
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
      default: return <TemplateEditor />;
    }
  })();

  return (
    <Group orientation="horizontal" style={{ height: '100%' }} resizeTargetMinimumSize={{ coarse: 30, fine: 20 }}>
      <Panel id="left" defaultSize={25} minSize={18}>
        <div style={{ 
          height: '100%', 
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(40px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <ProjectSidebar />
        </div>
      </Panel>
      <Separator id="sep-left" style={{ 
        width: 4, 
        background: 'rgba(255, 255, 255, 0.03)', 
        zIndex: 1,
        borderRadius: 2,
        margin: '8px 0',
        transition: 'background 0.2s ease',
      }} />
      <Panel id="center" defaultSize={45} minSize={30}>
        <div style={{ 
          height: '100%', 
          background: 'rgba(255, 255, 255, 0.01)',
        }}>
          {centerPanel}
        </div>
      </Panel>
      <Separator id="sep-right" style={{ 
        width: 4, 
        background: 'rgba(255, 255, 255, 0.03)', 
        zIndex: 1,
        borderRadius: 2,
        margin: '8px 0',
        transition: 'background 0.2s ease',
      }} />
      <Panel id="right" defaultSize={30} minSize={20}>
        <div style={{ 
          height: '100%', 
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(40px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <PreviewPanel />
        </div>
      </Panel>
    </Group>
  );
}
