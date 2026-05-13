import { useState, useCallback } from 'react';
import { makeStyles, mergeClasses, Button } from '@fluentui/react-components';
import { Dialog, DialogSurface, DialogTitle, DialogBody } from '@fluentui/react-components';
import { cardTemplates, type CardTemplate } from '../templates/cardTemplates';
import type { DeckMeta } from '../types/project';
import { useProjectStore, useDeckStore, useEditorStore, useUiStore } from '../../store';
import { invoke } from '@tauri-apps/api/core';

const useStyles = makeStyles({
  dialogSurface: { maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' },
  dialogBody: { display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' },
  dialogContent: { overflowY: 'auto', overflowX: 'hidden', flex: 1, paddingRight: '4px' },
  sectionLabel: { fontSize: '12px', fontWeight: 600, color: 'var(--mica-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  nameInput: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    borderTopWidth: '1px', borderRightWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px',
    borderTopStyle: 'solid', borderRightStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid',
    borderTopColor: 'var(--mica-stroke)', borderRightColor: 'var(--mica-stroke)',
    borderBottomColor: 'var(--mica-stroke)', borderLeftColor: 'var(--mica-stroke)',
    background: 'var(--mica-layer-1)', color: 'var(--mica-text-primary)', fontSize: '14px',
    outline: 'none', fontFamily: "'IBM Plex Sans', sans-serif",
    ':focus': {
      borderTopColor: 'var(--mica-accent)', borderRightColor: 'var(--mica-accent)',
      borderBottomColor: 'var(--mica-accent)', borderLeftColor: 'var(--mica-accent)',
    },
  },
  templateGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
  templateCard: {
    padding: '14px', borderRadius: '10px', background: 'var(--mica-layer-1)',
    border: '1px solid var(--mica-stroke)', cursor: 'pointer', position: 'relative',
    ':hover': { background: 'var(--mica-layer-2)', transform: 'translateY(-1px)' },
  },
  templateCardSelected: {
    background: 'var(--mica-accent-secondary)',
    borderTopColor: 'var(--mica-accent)',
    borderRightColor: 'var(--mica-accent)',
    borderBottomColor: 'var(--mica-accent)',
    borderLeftColor: 'var(--mica-accent)',
    boxShadow: '0 0 0 2px var(--mica-accent)',
  },
  templateName: { fontSize: '14px', fontWeight: 600, color: 'var(--mica-text-primary)', marginBottom: '6px' },
  templateDesc: { fontSize: '12px', color: 'var(--mica-text-tertiary)', lineHeight: 1.4, marginBottom: '10px' },
  templateSize: {
    fontSize: '11px', color: 'var(--mica-text-tertiary)', fontWeight: 500,
    padding: '2px 8px', borderRadius: '4px', background: 'var(--mica-layer-2)', display: 'inline-block',
  },
  dialogActions: {
    marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--mica-stroke)',
    display: 'flex', justifyContent: 'flex-end', gap: '10px',
  },
});

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateDialog({ open, onOpenChange }: TemplateDialogProps) {
  const styles = useStyles();
  const projectPath = useProjectStore((s) => s.projectPath);
  const manifest = useProjectStore((s) => s.manifest);
  const addDeck = useProjectStore((s) => s.addDeck);
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const loadData = useDeckStore((s) => s.loadData);
  const loadCardBack = useEditorStore((s) => s.loadCardBack);
  const setSidebarTab = useUiStore((s) => s.setSidebarTab);

  const [deckName, setDeckName] = useState(`Deck ${(manifest?.decks.length || 0) + 1}`);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof cardTemplates[0] | null>(null);

  const handleSelectDeck = useCallback(async (deck: DeckMeta) => {
    if (!projectPath) return;
    setActiveDeck(deck.id);
    const fullPath = `${projectPath}/${deck.path}`;
    await loadTemplate(fullPath);
    await loadData(fullPath, deck);
    await loadCardBack(fullPath);
    setSidebarTab('decks');
  }, [projectPath, setActiveDeck, loadTemplate, loadData, loadCardBack, setSidebarTab]);

  const handleConfirmCreateDeck = useCallback(async () => {
    if (!projectPath || !deckName.trim()) return;
    const template = selectedTemplate || cardTemplates[0];
    addDeck(deckName, template.cardSize);

    const updatedManifest = useProjectStore.getState().manifest;
    const newDeck = updatedManifest?.decks.find((d: DeckMeta) => d.name === deckName);

    if (newDeck) {
      const deckPath = `${projectPath}/${newDeck.path}`;
      try {
        await invoke('write_template', { deckPath, html: template.html, css: template.css });
        if (template.sampleData.length > 0) {
          const headers = Object.keys(template.sampleData[0]);
          const csvContent = [
            headers.join(','),
            ...template.sampleData.map((row: Record<string, string>) =>
              headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`).join(',')
            ),
          ].join('\n');
          await invoke('write_csv_content', { path: `${deckPath}/cards.csv`, content: csvContent });
        }
        await handleSelectDeck(newDeck);
      } catch (e) {
        console.error('Failed to create deck:', e);
      }
    }
    onOpenChange(false);
  }, [projectPath, deckName, selectedTemplate, addDeck, handleSelectDeck, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(_e, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogTitle style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
          Create New Deck
        </DialogTitle>
        <DialogBody className={styles.dialogBody}>
          <div>
            <label className={styles.sectionLabel} style={{ marginBottom: '8px', display: 'block' }}>
              Deck Name
            </label>
            <input
              type="text" value={deckName} onChange={(e) => setDeckName(e.target.value)}
              className={styles.nameInput} placeholder="Enter deck name" autoFocus
            />
          </div>
          <div>
            <label className={styles.sectionLabel} style={{ marginBottom: '10px', display: 'block' }}>
              Choose Template
            </label>
            <div className={styles.dialogContent}>
              <div className={styles.templateGrid}>
                {cardTemplates.map((template: CardTemplate) => (
                  <div
                    key={template.id}
                    className={mergeClasses(
                      styles.templateCard,
                      selectedTemplate?.id === template.id && styles.templateCardSelected
                    )}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className={styles.templateName}>{template.name}</div>
                    <div className={styles.templateDesc}>{template.description}</div>
                    <div className={styles.templateSize}>
                      {template.cardSize.widthMm}×{template.cardSize.heightMm}mm
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogBody>
        <div className={styles.dialogActions}>
          <Button appearance="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button appearance="primary" onClick={handleConfirmCreateDeck} disabled={!deckName.trim()} style={{ minWidth: '120px' }}>
            Create Deck
          </Button>
        </div>
      </DialogSurface>
    </Dialog>
  );
}
