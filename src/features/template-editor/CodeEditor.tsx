import { TabList, Tab } from '@fluentui/react-components';
import type { SelectTabEvent, SelectTabData } from '@fluentui/react-tabs';
import Editor, { type BeforeMount } from '@monaco-editor/react';
import { useEditorStore, useDeckStore } from '../../store';
import { useEffect, useRef } from 'react';
import { registerHandlebarsCompletions } from './HandlebarsHelper';

export function CodeEditor() {
  const html = useEditorStore((s) => s.html);
  const css = useEditorStore((s) => s.css);
  const activeTab = useEditorStore((s) => s.activeTab);
  const setHtml = useEditorStore((s) => s.setHtml);
  const setCss = useEditorStore((s) => s.setCss);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const columns = useDeckStore((s) => s.deckData?.columns) || [];
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null);
  const disposeRef = useRef<(() => void) | { dispose: () => void } | null>(null);

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

  const handleBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ paddingLeft: 8, borderBottom: '1px solid var(--mica-stroke)', display: 'flex', alignItems: 'center' }}>
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
