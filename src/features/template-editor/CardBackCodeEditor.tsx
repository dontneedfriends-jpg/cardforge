import { TabList, Tab } from '@fluentui/react-components';
import type { SelectTabEvent, SelectTabData } from '@fluentui/react-tabs';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '../../store';
import { useState } from 'react';

export function CardBackCodeEditor() {
  const cardBackHtml = useEditorStore((s) => s.cardBackHtml);
  const cardBackCss = useEditorStore((s) => s.cardBackCss);
  const setCardBackHtml = useEditorStore((s) => s.setCardBackHtml);
  const setCardBackCss = useEditorStore((s) => s.setCardBackCss);
  const [activeTab, setActiveTab] = useState<'html' | 'css'>('html');

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
          <Tab value="html">cardback.html</Tab>
          <Tab value="css">cardback.css</Tab>
        </TabList>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'html' && (
          <Editor
            key="cb-html"
            height="100%"
            language="html"
            value={cardBackHtml}
            onChange={(value) => {
              if (value !== undefined) setCardBackHtml(value);
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
            key="cb-css"
            height="100%"
            language="css"
            value={cardBackCss}
            onChange={(value) => {
              if (value !== undefined) setCardBackCss(value);
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
