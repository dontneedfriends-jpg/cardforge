import { Text, Button, makeStyles, Dropdown, Option, MessageBar, MessageBarBody, RadioGroup, Radio, Input, Switch } from '@fluentui/react-components';
import { useProjectStore, useDeckStore, useEditorStore, useUiStore } from '../../store';
import { renderCardBody } from '../preview/CardRenderer';
import { exportAllCardsAsPng, generatePrintHtml, exportTtsSpritesheet } from './exportUtils';
import type { PdfExportOptions } from '../../shared/types/project';
import type { ProgressCallback } from './exportUtils';
import { ProgressDialog } from '../../shared/components/ProgressDialog';
import { useState, useCallback, useRef, useEffect } from 'react';
import { CARD_SIZE_PRESETS, findPreset } from '../../shared/cardSizes';
import type { CardSize } from '../../shared/types/project';

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
  const [overrideCardSize, setOverrideCardSize] = useState<CardSize | null>(null);
  const [status, setStatus] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [progressCurrent, setProgressCurrent] = useState<number | undefined>(undefined);
  const [progressTotal, setProgressTotal] = useState<number | undefined>(undefined);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const cancelRef = useRef(false);
  const [options, setOptions] = useState<PdfExportOptions>({
    dpi: defaultExportDpi,
    bleed: defaultBleedMm,
    pageSize: 'A4',
    cropMarks: true,
    lowInk: false,
  });

  const decks = manifest?.decks || [];

  useEffect(() => {
    if (decks.length > 0 && !selectedDeckId) {
      setSelectedDeckId(decks[0].id);
      setOverrideCardSize(null);
    }
  }, [decks.length, selectedDeckId]);

  const selectedDeck = manifest?.decks.find(d => d.id === selectedDeckId);
  const effectiveCardSize: CardSize = overrideCardSize ?? selectedDeck?.cardSize ?? { widthMm: 63, heightMm: 88, bleedMm: 3 };
  const selectedPresetName = effectiveCardSize ? findPreset(effectiveCardSize.widthMm, effectiveCardSize.heightMm)?.name : undefined;

  const handleExport = useCallback(async () => {
    if (!projectPath || !selectedDeckId || !manifest) return;
    const deck = manifest.decks.find(d => d.id === selectedDeckId);
    if (!deck) return;
    setExporting(true);
    setStatus('');
    setProgressCurrent(undefined);
    setProgressTotal(undefined);
    setProgressStatus('Preparing...');
    cancelRef.current = false;

    const pc: ProgressCallback = {
      onProgress: (current, total) => { setProgressCurrent(current); setProgressTotal(total); },
      onStatus: (s) => setProgressStatus(s),
      get cancelled() { return cancelRef.current; },
    };

    try {
      await useEditorStore.getState().saveTemplate();
      const ds = useDeckStore.getState();
      if (ds.deckData) await ds.saveData();

      const rows = ds.deckData?.rows || [];
      if (rows.length === 0) { setStatus('No cards to export'); setExporting(false); return; }

      const allCards = rows.map(row => renderCardBody(editorHtml, editorCss, row));

      if (format === 'png') {
        await exportAllCardsAsPng(deck.name, allCards, effectiveCardSize, options.dpi, projectPath, pc);
        if (!cancelRef.current) setStatus(`Exported ${allCards.length} PNGs successfully`);
        else setStatus('Export cancelled');
      } else if (format === 'tts') {
        setProgressStatus('Capturing cards for TTS...');
        const es = useEditorStore.getState();
        const msg = await exportTtsSpritesheet(
          deck.name, allCards, es.cardBack, effectiveCardSize, options.dpi, projectPath, pc
        );
        setStatus(msg || (cancelRef.current ? 'Export cancelled' : 'TTS export error'));
      } else {
        setProgressStatus('Generating print layout...');
        const printHtml = await generatePrintHtml(allCards, effectiveCardSize, options, projectPath);
        setProgressStatus('Opening print dialog...');
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
    setProgressCurrent(undefined);
    setProgressTotal(undefined);
    setProgressStatus('');
  }, [projectPath, selectedDeckId, manifest, format, editorHtml, editorCss, options, overrideCardSize]);

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
            {effectiveCardSize.widthMm} × {effectiveCardSize.heightMm}mm · {selectedDeck.name} ({effectiveCardSize.bleedMm}mm bleed)
            {overrideCardSize ? ' (override)' : ''}
          </Text>
        )}
      </div>

      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Format</Text>
        <RadioGroup
          value={format}
          onChange={(_e: unknown, data) => setFormat(data.value as 'png' | 'pdf' | 'tts')}
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

        <div className={styles.row}>
          <div className={styles.field} style={{ minWidth: 280 }}>
            <Text className={styles.label}>Card Size</Text>
            <Dropdown
              value={selectedPresetName ? `${selectedPresetName} (${effectiveCardSize.widthMm}×${effectiveCardSize.heightMm}mm)` : `Custom (${effectiveCardSize.widthMm}×${effectiveCardSize.heightMm}mm)`}
              onOptionSelect={(_e: unknown, data: { optionValue?: string }) => {
                if (!data.optionValue) return;
                if (data.optionValue === '__deck__') { setOverrideCardSize(null); return; }
                const preset = CARD_SIZE_PRESETS.find(p => p.id === data.optionValue);
                if (preset) setOverrideCardSize({ widthMm: preset.widthMm, heightMm: preset.heightMm, bleedMm: preset.bleedMm });
              }}
            >
              <Option value="__deck__" text="Use deck size">{selectedDeck ? `Use deck size (${selectedDeck.cardSize.widthMm}×${selectedDeck.cardSize.heightMm}mm)` : 'Use deck size'}</Option>
              {CARD_SIZE_PRESETS.map(p => (
                <Option key={p.id} value={p.id} text={`${p.name} — ${p.widthMm}×${p.heightMm}mm`}>
                  {p.name} — {p.widthMm}×{p.heightMm}mm{p.bleedMm > 0 ? ` (${p.bleedMm}mm bleed)` : ''}
                </Option>
              ))}
            </Dropdown>
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

      <ProgressDialog
        open={exporting}
        title={`Export ${format.toUpperCase()}`}
        status={progressStatus}
        current={progressCurrent}
        total={progressTotal}
        onCancel={() => { cancelRef.current = true; }}
      />
    </div>
  );
}
