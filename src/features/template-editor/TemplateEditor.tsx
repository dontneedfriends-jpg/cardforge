import { ToggleButton, Tab, TabList, Button, makeStyles, Text } from '@fluentui/react-components';
import { CodeRegular, BorderNoneRegular, SaveRegular } from '@fluentui/react-icons';
import { useEditorStore, useUiStore } from '../../store';
import { CodeEditor } from './CodeEditor';
import { VisualEditor } from './VisualEditor';
import { CardBackEditor } from './CardBackEditor';
import { CardBackCodeEditor } from './CardBackCodeEditor';
import { useState, useEffect, useRef, useCallback } from 'react';

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    gap: '8px',
    height: '48px',
    minHeight: '48px',
    padding: '0 16px',
    background: 'var(--mica-layer-1)',
    borderBottom: '1px solid var(--mica-stroke)',
    alignItems: 'center',
  },
  modeButtons: {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    background: 'var(--mica-layer-2)',
    borderRadius: '8px',
    border: '1px solid var(--mica-stroke)',
  },
  dirtyDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--mica-error)',
    marginLeft: '8px',
    boxShadow: '0 0 6px var(--mica-error)',
  },
  syncIndicator: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--mica-text-tertiary)',
  },
});

export function TemplateEditor() {
  const styles = useStyles();
  const editorMode = useEditorStore((s) => s.editorMode);
  const setEditorMode = useEditorStore((s) => s.setEditorMode);
  const cardBackEditorMode = useEditorStore((s) => s.cardBackEditorMode);
  const setCardBackEditorMode = useEditorStore((s) => s.setCardBackEditorMode);
  const isDirty = useEditorStore((s) => s.isDirty);
  const syncVisualToCode = useEditorStore((s) => s.syncVisualToCode);
  const syncCodeToVisual = useEditorStore((s) => s.syncCodeToVisual);
  const syncCardBackVisualToCode = useEditorStore((s) => s.syncCardBackVisualToCode);
  const syncCardBackCodeToVisual = useEditorStore((s) => s.syncCardBackCodeToVisual);
  const saveTemplate = useEditorStore((s) => s.saveTemplate);
  const saveCardBack = useEditorStore((s) => s.saveCardBack);
  const [tab, setTab] = useState<string>('front');

  // Auto-save
  const autoSave = useUiStore((s) => s.autoSave);
  const autoSaveInterval = useUiStore((s) => s.autoSaveInterval);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!autoSave || !isDirty) return;
    timerRef.current = setTimeout(() => {
      handleSave();
    }, autoSaveInterval * 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, autoSave, autoSaveInterval, tab]);

  const handleModeSwitch = (mode: 'code' | 'visual') => {
    if (mode === editorMode) return;
    if (mode === 'visual') {
      if (syncCodeToVisual()) {
        setEditorMode('visual');
      }
    } else {
      syncVisualToCode();
      setEditorMode('code');
    }
  };

  const handleCardBackModeSwitch = (mode: 'code' | 'visual') => {
    if (mode === cardBackEditorMode) return;
    if (mode === 'code') {
      syncCardBackVisualToCode();
      setCardBackEditorMode('code');
    } else {
      if (syncCardBackCodeToVisual()) {
        setCardBackEditorMode('visual');
      }
    }
  };

  const handleSave = useCallback(async () => {
    if (tab === 'front') {
      await saveTemplate();
    } else {
      await saveCardBack();
    }
  }, [tab, saveTemplate, saveCardBack]);

  const renderFrontEditor = () => {
    if (editorMode === 'code') return <CodeEditor />;
    return <VisualEditor />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={styles.toolbar}>
        <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as string)}>
          <Tab value="front">Front</Tab>
          <Tab value="back">Back</Tab>
        </TabList>

        {tab === 'front' && (
          <div className={styles.modeButtons} style={{ marginLeft: 12 }}>
            <ToggleButton
              icon={<CodeRegular />}
              checked={editorMode === 'code'}
              onClick={() => handleModeSwitch('code')}
              size="small"
              appearance={editorMode === 'code' ? 'primary' : 'subtle'}
            >
              Code
            </ToggleButton>
            <ToggleButton
              icon={<BorderNoneRegular />}
              checked={editorMode === 'visual'}
              onClick={() => handleModeSwitch('visual')}
              size="small"
              appearance={editorMode === 'visual' ? 'primary' : 'subtle'}
            >
              Visual
            </ToggleButton>
          </div>
        )}

        {tab === 'back' && (
          <div className={styles.modeButtons} style={{ marginLeft: 12 }}>
            <ToggleButton
              icon={<CodeRegular />}
              checked={cardBackEditorMode === 'code'}
              onClick={() => handleCardBackModeSwitch('code')}
              size="small"
              appearance={cardBackEditorMode === 'code' ? 'primary' : 'subtle'}
            >
              Code
            </ToggleButton>
            <ToggleButton
              icon={<BorderNoneRegular />}
              checked={cardBackEditorMode === 'visual'}
              onClick={() => handleCardBackModeSwitch('visual')}
              size="small"
              appearance={cardBackEditorMode === 'visual' ? 'primary' : 'subtle'}
            >
              Visual
            </ToggleButton>
          </div>
        )}

        {isDirty && <div className={styles.dirtyDot} title="Unsaved changes" />}

        <div className={styles.syncIndicator}>
          <Text size={200}>
            {tab === 'front'
              ? (editorMode === 'code' ? 'Edit HTML/CSS directly' : 'Drag & drop elements')
              : (cardBackEditorMode === 'code' ? 'Edit card back HTML/CSS' : 'Customize card back appearance')}
          </Text>
          <Button
            icon={<SaveRegular />}
            size="small"
            appearance="subtle"
            onClick={handleSave}
            disabled={!isDirty}
          >
            Save
          </Button>
        </div>
      </div>

      {tab === 'front' ? renderFrontEditor() : (
        cardBackEditorMode === 'code' ? <CardBackCodeEditor /> : <CardBackEditor />
      )}
    </div>
  );
}
