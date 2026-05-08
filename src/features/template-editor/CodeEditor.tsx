import { TabList, Tab, Button } from '@fluentui/react-components';
import type { SelectTabEvent, SelectTabData } from '@fluentui/react-tabs';
import Editor from '@monaco-editor/react';
import { useEditorStore, useDeckStore } from '../../store';
import { useEffect, useRef } from 'react';
import { registerHandlebarsCompletions } from './HandlebarsHelper';
import { ArrowSyncRegular } from '@fluentui/react-icons';

const SYNC_DEBOUNCE_MS = 600;

export function CodeEditor() {
  const html = useEditorStore((s) => s.html);
  const css = useEditorStore((s) => s.css);
  const activeTab = useEditorStore((s) => s.activeTab);
  const setHtml = useEditorStore((s) => s.setHtml);
  const setCss = useEditorStore((s) => s.setCss);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const syncCodeToVisual = useEditorStore((s) => s.syncCodeToVisual);
  const syncSource = useEditorStore((s) => s.syncSource);
  const editorMode = useEditorStore((s) => s.editorMode);
  const columns = useDeckStore((s) => s.deckData?.columns) || [];
  const monacoRef = useRef<any>(null);
  const disposeRef = useRef<(() => void) | { dispose: () => void } | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Храним актуальные значения в ref-ах для использования внутри debounce-коллбэка
  const syncCodeToVisualRef = useRef(syncCodeToVisual);
  syncCodeToVisualRef.current = syncCodeToVisual;
  const syncSourceRef = useRef(syncSource);
  syncSourceRef.current = syncSource;
  const editorModeRef = useRef(editorMode);
  editorModeRef.current = editorMode;

  useEffect(() => {
    if (!monacoRef.current) return;
    if (disposeRef.current) {
      if (typeof disposeRef.current === 'function') {
        disposeRef.current();
      } else if (disposeRef.current.dispose) {
        disposeRef.current.dispose();
      }
      disposeRef.current = null;
    }
    if (columns.length > 0) {
      const d = registerHandlebarsCompletions(monacoRef.current, columns);
      if (d) disposeRef.current = d;
    }
  }, [columns]);

  // Очищаем таймер при размонтировании
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleBeforeMount = (monaco: any) => {
    monacoRef.current = monaco;
  };

  // Debounce-синхронизация: вызывается только по действию пользователя (onChange Monaco).
  // Проверяем syncSource — если 'visual', значит html/css только что пришли из canvas,
  // не нужно их парсить обратно (это и есть защита от цикла).
  const scheduleSync = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      console.log('[Sync] Debounce fired. editorMode:', editorModeRef.current, 'syncSource:', syncSourceRef.current);
      if (editorModeRef.current === 'visual' && syncSourceRef.current !== 'visual') {
        console.log('[Sync] Calling syncCodeToVisual...');
        syncCodeToVisualRef.current();
      } else {
        console.log('[Sync] Skipped syncCodeToVisual');
      }
    }, SYNC_DEBOUNCE_MS);
  };

  const handleSync = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    syncCodeToVisual();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ paddingLeft: 8, borderBottom: '1px solid var(--colorNeutralStroke2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <TabList
          selectedValue={activeTab}
          onTabSelect={(_e: SelectTabEvent, data: SelectTabData) => {
            if (data.value === 'html' || data.value === 'css') {
              setActiveTab(data.value);
            }
          }}
        >
          <Tab value="html">template.html</Tab>
          <Tab value="css">template.css</Tab>
        </TabList>
        <Button
          size="small"
          appearance="subtle"
          icon={<ArrowSyncRegular fontSize={14} />}
          onClick={handleSync}
          style={{ marginRight: 8 }}
        >
          Sync to Visual
        </Button>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'html' && (
          <Editor
            key="html-editor"
            height="100%"
            language="html"
            value={html}
            beforeMount={handleBeforeMount}
            onChange={(value) => {
              if (value !== undefined) {
                setHtml(value);
                scheduleSync();
              }
            }}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        )}
        {activeTab === 'css' && (
          <Editor
            key="css-editor"
            height="100%"
            language="css"
            value={css}
            onChange={(value) => {
              if (value !== undefined) {
                setCss(value);
                scheduleSync();
              }
            }}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        )}
      </div>
    </div>
  );
}
