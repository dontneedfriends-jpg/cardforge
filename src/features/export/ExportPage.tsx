import { Text, Button, makeStyles, Dropdown, Option, MessageBar, MessageBarBody, RadioGroup, Radio } from '@fluentui/react-components';
import { useProjectStore, useDeckStore, useEditorStore } from '../../store';
import { renderCardBody } from '../preview/CardRenderer';
import { useState, useEffect, useCallback } from 'react';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
    padding: '32px 40px',
    gap: '24px',
    maxWidth: '600px',
    margin: '0 auto',
    width: '100%',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'rgba(255, 255, 255, 0.40)',
  },
});

export function ExportPage() {
  const styles = useStyles();
  const manifest = useProjectStore((s) => s.manifest);
  const projectPath = useProjectStore((s) => s.projectPath);
  const deckStore = useDeckStore.getState;
  const editorHtml = useEditorStore((s) => s.html);
  const editorCss = useEditorStore((s) => s.css);
  const [format, setFormat] = useState<'png' | 'pdf'>('png');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const decks = manifest?.decks || [];

  useEffect(() => {
    if (decks.length > 0 && !selectedDeckId) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks]);

  const handleExport = useCallback(async () => {
    if (!projectPath || !selectedDeckId || !manifest) return;
    const deck = manifest.decks.find(d => d.id === selectedDeckId);
    if (!deck) return;

    try {
      await useEditorStore.getState().saveTemplate();
      const ds = deckStore();
      if (ds.deckData) await ds.saveData();

      if (format === 'pdf') {
        const rows = ds.deckData?.rows || [];
        if (rows.length === 0) { setStatus('No cards to export'); return; }

        const allCards = rows.map(row => renderCardBody(editorHtml, editorCss, row, projectPath));
        const printHtml = `<!DOCTYPE html>
<html><head><style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { display: flex; flex-wrap: wrap; gap: 5mm; padding: 10mm; }
  .card-wrap { width: ${deck.cardSize.widthMm}mm; height: ${deck.cardSize.heightMm}mm; overflow: hidden; }
  ${allCards.map(c => c.css).join('\n')}
</style></head><body>
${allCards.map(c => `<div class="card-wrap">${c.body}</div>`).join('\n')}
</body></html>`;

        const blob = new Blob([printHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setStatus('Print preview opened — use Ctrl+P to save as PDF');
      } else {
        setStatus('Saved. PNG batch export coming in Phase 2 — use the print preview (PDF mode) for now.');
      }
    } catch (e: any) {
      setStatus(`Export error: ${e?.toString()}`);
    }
  }, [projectPath, selectedDeckId, manifest, format, editorHtml, editorCss, deckStore]);

  if (!manifest || !projectPath) {
    return (
      <div className={styles.container}>
        <Text size={600} weight="semibold">Export</Text>
        <Text size={300}>Open a project to export cards</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Text size={600} weight="semibold">Export</Text>

      <div className={styles.section}>
        <Text size={400} weight="semibold">Deck</Text>
        <Dropdown
          value={decks.find(d => d.id === selectedDeckId)?.name || ''}
          selectedOptions={selectedDeckId ? [selectedDeckId] : []}
          onOptionSelect={(_e: unknown, data: { optionValue?: string }) => {
            if (data.optionValue) setSelectedDeckId(data.optionValue);
          }}
          style={{ maxWidth: 300 }}
          placeholder="Select a deck"
        >
          {decks.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
        </Dropdown>
      </div>

      <div className={styles.section}>
        <Text size={400} weight="semibold">Format</Text>
        <RadioGroup
          value={format}
          onChange={(_e: unknown, data: any) => setFormat(data.value)}
        >
          <Radio value="png" label="PNG — individual card images (coming in Phase 2)" />
          <Radio value="pdf" label="PDF — print-ready layout (opens print preview)" />
        </RadioGroup>
      </div>

      <Button appearance="primary" onClick={handleExport} style={{ alignSelf: 'flex-start' }}>
        Export {format.toUpperCase()}
      </Button>

      {status && (
        <MessageBar intent={status.startsWith('Export error') ? 'error' : 'info'}>
          <MessageBarBody>{status}</MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
}
