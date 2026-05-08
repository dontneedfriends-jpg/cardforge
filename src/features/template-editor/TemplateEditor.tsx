import { ToggleButton, Tab, TabList, Dialog, DialogTrigger, DialogSurface, DialogBody, DialogTitle, DialogContent, Button, makeStyles, Text } from '@fluentui/react-components';
import { CodeRegular, BorderNoneRegular, SaveRegular, ColorRegular } from '@fluentui/react-icons';
import { useEditorStore } from '../../store';
import { CodeEditor } from './CodeEditor';
import { VisualEditor } from './VisualEditor';
import { CardBackEditor } from './CardBackEditor';
import { useState } from 'react';

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    gap: '8px',
    height: '48px',
    minHeight: '48px',
    padding: '0 16px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  modeButtons: {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
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
    color: 'rgba(255, 255, 255, 0.40)',
  },
});

export function TemplateEditor() {
  const styles = useStyles();
  const editorMode = useEditorStore((s) => s.editorMode);
  const setEditorMode = useEditorStore((s) => s.setEditorMode);
  const html = useEditorStore((s) => s.html);
  const isDirty = useEditorStore((s) => s.isDirty);
  const syncVisualToCode = useEditorStore((s) => s.syncVisualToCode);
  const syncCodeToVisual = useEditorStore((s) => s.syncCodeToVisual);
  const saveTemplate = useEditorStore((s) => s.saveTemplate);
  const saveCardBack = useEditorStore((s) => s.saveCardBack);
  const [warnOpen, setWarnOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<'code' | 'visual' | null>(null);
  const [tab, setTab] = useState<string>('front');

  const handleModeSwitch = (mode: 'code' | 'visual') => {
    if (mode === editorMode) return;
    
    if (mode === 'visual') {
      if (html.trim().length > 0) {
        setPendingMode('visual');
        setWarnOpen(true);
      } else {
        syncCodeToVisual();
        setEditorMode('visual');
      }
    } else {
      syncVisualToCode({ widthMm: 63, heightMm: 88, bleedMm: 3 });
      setEditorMode('code');
    }
  };

  const confirmSwitch = () => {
    setWarnOpen(false);
    if (pendingMode === 'visual') {
      syncCodeToVisual();
      setEditorMode('visual');
    }
    setPendingMode(null);
  };

  const handleSave = async () => {
    if (tab === 'front') {
      await saveTemplate();
    } else {
      await saveCardBack();
    }
  };

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
            <ColorRegular fontSize={16} />
            <Text size={200}>Design Editor</Text>
          </div>
        )}

        {isDirty && <div className={styles.dirtyDot} title="Unsaved changes" />}

        <div className={styles.syncIndicator}>
          <Text size={200}>
            {tab === 'front'
              ? (editorMode === 'code' ? 'Edit HTML/CSS directly' : 'Drag & drop elements')
              : 'Customize card back appearance'}
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

      {tab === 'front' ? renderFrontEditor() : <CardBackEditor />}

      <Dialog open={warnOpen} onOpenChange={(_e, data) => setWarnOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Switch to Visual Editor?</DialogTitle>
            <DialogContent>
              Your HTML template will be parsed into visual elements.
              Some manual HTML/CSS may not be fully represented in the visual editor.
              The visual editor works best with simple, absolutely-positioned elements.
            </DialogContent>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <DialogTrigger disableButtonEnhancement>
                <Button>Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={confirmSwitch}>Switch Anyway</Button>
            </div>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
