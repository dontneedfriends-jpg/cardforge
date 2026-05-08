import { Text, Button, makeStyles, Dropdown, Option, MessageBar, MessageBarBody, RadioGroup, Radio, Input, Switch } from '@fluentui/react-components';
import { useProjectStore, useDeckStore, useEditorStore, useUiStore } from '../../store';
import { renderCardBody } from '../preview/CardRenderer';
import { exportAllCardsAsPng, generatePrintHtml, exportTtsSpritesheet } from './exportUtils';
import type { PdfExportOptions } from '../../shared/types/project';
import { useState, useCallback } from 'react';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
    padding: '32px 40px',
    gap: '24px',
    maxWidth: '640px',
    margin: '0 auto',
    width: '100%',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
    background: 'var(--mica-layer-1)',
    border: `1px solid var(--mica-stroke)`,
    borderRadius: '12px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--mica-text-tertiary)',
  },
  row: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '120px',
  },
  label: {
    fontSize: '12px',
    color: 'var(--mica-text-tertiary)',
  },
});

export function ExportPage() {
  const styles = useStyles();
  const manifest = useProjectStore((s) => s.manifest);
  const projectPath = useProjectStore((s) => s.projectPath);
  const editorHtml = useEditorStore((s) => s.html);
  const editorCss = useEditorStore((s) => s.css);
  const defaultExportDpi = useUiStore((s) => s.defaultExportDpi);
  const defaultBleedMm = useUiStore((s) => s.defaultBleedMm);
  const [format, setFormat] = useState<'png' | 'pdf' | 'tts'>('png');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [options, setOptions] = useState<PdfExportOptions>({
    dpi: defaultExportDpi,
    bleed: defaultBleedMm,
    pageSize: 'A4',
    cropMarks: true,
    lowInk: false,
  });

  const decks = manifest?.decks || [];

  if (decks.length > 0 && !selectedDeckId) {
    setSelectedDeckId(decks[0].id);
  }

  const selectedDeck = manifest?.decks.find(d => d.id === selectedDeckId);

  const handleExport = useCallback(async () => {
    if (!projectPath || !selectedDeckId || !manifest) return;
    const deck = manifest.decks.find(d => d.id === selectedDeckId);
    if (!deck) return;
    setExporting(true);
    setStatus('');

    try {
      await useEditorStore.getState().saveTemplate();
      const ds = useDeckStore.getState();
      if (ds.deckData) await ds.saveData();

      const rows = ds.deckData?.rows || [];
      if (rows.length === 0) { setStatus('No cards to export'); setExporting(false); return; }

      const allCards = rows.map(row => renderCardBody(editorHtml, editorCss, row));

      if (format === 'png') {
        setStatus(`Capturing ${allCards.length} cards...`);
        await exportAllCardsAsPng(deck.name, allCards, deck.cardSize, options.dpi, projectPath);
        setStatus(`Exported ${allCards.length} PNGs successfully`);
      } else if (format === 'tts') {
        setStatus(`Capturing ${allCards.length} cards for TTS...`);
        const es = useEditorStore.getState();
        const msg = await exportTtsSpritesheet(
          deck.name, allCards, es.cardBack, deck.cardSize, options.dpi, projectPath
        );
        setStatus(msg || 'TTS export cancelled');
      } else {
        const printHtml = await generatePrintHtml(allCards, deck.cardSize, options, projectPath);
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;';
        document.body.appendChild(iframe);
        iframe.srcdoc = printHtml;
        const timeout = setTimeout(() => { /* onload may already have fired */ }, 3000);
        await new Promise<void>((resolve) => {
          iframe.onload = () => { clearTimeout(timeout); resolve(); };
          iframe.onerror = () => { clearTimeout(timeout); resolve(); };
        });
        const w = iframe.contentWindow;
        if (w) {
          w.onafterprint = () => {
            document.body.removeChild(iframe);
            setStatus('PDF export complete');
          };
          w.print();
        } else {
          document.body.removeChild(iframe);
        }
        setStatus('Print dialog opened — choose "Save as PDF"');
      }
    } catch (e: any) {
      setStatus(`Export error: ${e?.toString()}`);
    }
    setExporting(false);
  }, [projectPath, selectedDeckId, manifest, format, editorHtml, editorCss, options]);

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
        <Text className={styles.sectionTitle}>Deck</Text>
        <Dropdown
          value={selectedDeck?.name || ''}
          selectedOptions={selectedDeckId ? [selectedDeckId] : []}
          onOptionSelect={(_e: unknown, data: { optionValue?: string }) => {
            if (data.optionValue) setSelectedDeckId(data.optionValue);
          }}
          style={{ maxWidth: 300 }}
          placeholder="Select a deck"
        >
          {decks.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
        </Dropdown>
        {selectedDeck && (
          <Text size={200} style={{ color: 'rgba(255,255,255,0.40)' }}>
            {selectedDeck.cardSize.widthMm} × {selectedDeck.cardSize.heightMm}mm · {decks.find(d => d.id === selectedDeckId)?.name} ({selectedDeck.cardSize.bleedMm}mm bleed)
          </Text>
        )}
      </div>

      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Format</Text>
        <RadioGroup
          value={format}
          onChange={(_e: unknown, data: any) => setFormat(data.value)}
        >
          <Radio value="png" label="PNG — individual card images" />
          <Radio value="pdf" label="PDF — print-ready layout (opens print preview)" />
          <Radio value="tts" label="Tabletop Simulator — spritesheet + JSON descriptor" />
        </RadioGroup>
      </div>

      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Options</Text>

        <div className={styles.row}>
          <div className={styles.field}>
            <Text className={styles.label}>DPI</Text>
            <Dropdown
              value={String(options.dpi)}
              selectedOptions={[String(options.dpi)]}
              onOptionSelect={(_e: unknown, data: { optionValue?: string }) => {
                if (data.optionValue) setOptions({ ...options, dpi: Number(data.optionValue) });
              }}
            >
              <Option value="150">150 (draft)</Option>
              <Option value="300">300 (standard)</Option>
              <Option value="600">600 (high quality)</Option>
            </Dropdown>
          </div>

          <div className={styles.field}>
            <Text className={styles.label}>Page Size</Text>
            <Dropdown
              value={options.pageSize}
              selectedOptions={[options.pageSize]}
              onOptionSelect={(_e: unknown, data: { optionValue?: string }) => {
                if (data.optionValue) setOptions({ ...options, pageSize: data.optionValue as 'A4' | 'Letter' });
              }}
            >
              <Option value="A4">A4 (210×297mm)</Option>
              <Option value="Letter">Letter (216×279mm)</Option>
            </Dropdown>
          </div>

          <div className={styles.field}>
            <Text className={styles.label}>Bleed (mm)</Text>
            <Input
              type="number"
              size="small"
              value={String(options.bleed)}
              onChange={(_, data) => setOptions({ ...options, bleed: Math.max(0, Number(data.value) || 0) })}
              style={{ width: 80 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Switch
            label="Crop marks"
            checked={options.cropMarks}
            onChange={(_e, data) => setOptions({ ...options, cropMarks: data.checked })}
          />
          <Switch
            label="Low ink mode"
            checked={options.lowInk}
            onChange={(_e, data) => setOptions({ ...options, lowInk: data.checked })}
          />
        </div>
      </div>

      <Button
        appearance="primary"
        onClick={handleExport}
        disabled={exporting || !selectedDeckId}
        style={{ alignSelf: 'flex-start' }}
      >
        {exporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
      </Button>

      {status && (
        <MessageBar intent={status.startsWith('Export error') ? 'error' : status.startsWith('Exported') ? 'success' : 'info'}>
          <MessageBarBody>{status}</MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
}
