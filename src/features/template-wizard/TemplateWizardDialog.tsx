import { useState, useCallback, useEffect } from 'react';
import { Text, makeStyles, Button, Dialog, DialogSurface, DialogTitle, DialogBody } from '@fluentui/react-components';
import { ChevronLeftRegular, ChevronRightRegular, DismissRegular } from '@fluentui/react-icons';
import { cardTemplates, type CardTemplate } from '../../shared/templates/cardTemplates';
import { CARD_SIZE_PRESETS, type CardSizePreset } from '../../shared/cardSizes';
import { useProjectStore, useDeckStore, useEditorStore, useUiStore } from '../../store';
import type { ColorPalette } from '../asset-generator/generators/colorGenerator';
import { applyThemeToTemplate, generateRichPalette } from './applyTheme';
import { invoke } from '@tauri-apps/api/core';
import type { DeckMeta } from '../../shared/types/project';

const useStyles = makeStyles({
  dialogSurface: { maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  dialogBody: { display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden', flex: 1 },
  content: { overflowY: 'auto', overflowX: 'hidden', flex: 1, padding: '4px' },
  stepIndicator: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' },
  stepDot: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--mica-stroke)', transition: 'all 0.2s' },
  stepDotActive: { background: 'var(--mica-accent)', width: '24px', borderRadius: '4px' },
  stepDotDone: { background: 'var(--mica-accent-secondary)' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  sizeCard: {
    padding: '14px', borderRadius: '10px', background: 'var(--mica-layer-1)',
    border: '1px solid var(--mica-stroke)', cursor: 'pointer', textAlign: 'center' as const,
    ':hover': { background: 'var(--mica-layer-2)', transform: 'translateY(-1px)' },
  },
  sizeCardSelected: {
    background: 'var(--mica-accent-secondary)',
    borderTopColor: 'var(--mica-accent)',
    borderRightColor: 'var(--mica-accent)',
    borderBottomColor: 'var(--mica-accent)',
    borderLeftColor: 'var(--mica-accent)',
    boxShadow: '0 0 0 2px var(--mica-accent)',
  },
  sizeName: { fontSize: '14px', fontWeight: 600, color: 'var(--mica-text-primary)' },
  sizeDim: { fontSize: '11px', color: 'var(--mica-text-tertiary)', marginTop: '4px' },
  templateCard: {
    padding: '14px', borderRadius: '10px', background: 'var(--mica-layer-1)',
    border: '1px solid var(--mica-stroke)', cursor: 'pointer',
    ':hover': { background: 'var(--mica-layer-2)' },
  },
  templateCardSelected: {
    background: 'var(--mica-accent-secondary)',
    borderTopColor: 'var(--mica-accent)',
    borderRightColor: 'var(--mica-accent)',
    borderBottomColor: 'var(--mica-accent)',
    borderLeftColor: 'var(--mica-accent)',
    boxShadow: '0 0 0 2px var(--mica-accent)',
  },
  templateName: { fontSize: '14px', fontWeight: 600, color: 'var(--mica-text-primary)', marginBottom: '4px' },
  templateDesc: { fontSize: '12px', color: 'var(--mica-text-tertiary)', lineHeight: 1.4 },
  themeGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  themeCard: {
    padding: '12px', borderRadius: '10px', background: 'var(--mica-layer-1)',
    border: '1px solid var(--mica-stroke)', cursor: 'pointer',
    ':hover': { background: 'var(--mica-layer-2)' },
  },
  themeCardSelected: {
    background: 'var(--mica-accent-secondary)',
    borderTopColor: 'var(--mica-accent)',
    borderRightColor: 'var(--mica-accent)',
    borderBottomColor: 'var(--mica-accent)',
    borderLeftColor: 'var(--mica-accent)',
    boxShadow: '0 0 0 2px var(--mica-accent)',
  },
  swatches: { display: 'flex', gap: '4px', marginBottom: '8px' },
  swatch: { width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--mica-stroke)' },
  previewSvg: { width: '100%', height: '80px', borderRadius: '6px', overflow: 'hidden', marginBottom: '4px' },
  actions: { display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--mica-stroke)' },
  nameInput: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--mica-stroke)',
    background: 'var(--mica-layer-1)', color: 'var(--mica-text-primary)', fontSize: '14px',
    outline: 'none', fontFamily: "'IBM Plex Sans', sans-serif",
    ':focus': {
      borderTopColor: 'var(--mica-accent)',
      borderRightColor: 'var(--mica-accent)',
      borderBottomColor: 'var(--mica-accent)',
      borderLeftColor: 'var(--mica-accent)',
    },
  },
  previewCard: {
    width: '200px', height: '280px', borderRadius: '10px', overflow: 'hidden',
    margin: '0 auto', border: '1px solid var(--mica-stroke)',
    position: 'relative' as const,
  },
  categoryLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--mica-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', marginTop: '12px' },
});

const STEPS = ['Size', 'Layout', 'Theme', 'Review'];
const STEP_LABELS = ['Choose card size', 'Pick a layout', 'Choose color theme', 'Name & create'];

const SIZE_PRESETS = CARD_SIZE_PRESETS.filter(p =>
  ['poker', 'bridge', 'standard_american', 'tarot', 'square_70', 'mini_american', 'euro', 'japanese', 'micro', 'tiny'].includes(p.id)
);

interface GeneratedTheme {
  palette: ColorPalette;
  html: string;
  css: string;
  backgroundSvg: string;
}

interface TemplateWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateWizardDialog({ open, onOpenChange }: TemplateWizardDialogProps) {
  const styles = useStyles();
  const projectPath = useProjectStore((s) => s.projectPath);
  const manifest = useProjectStore((s) => s.manifest);
  const addDeck = useProjectStore((s) => s.addDeck);
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const loadData = useDeckStore((s) => s.loadData);
  const loadCardBack = useEditorStore((s) => s.loadCardBack);
  const setSidebarTab = useUiStore((s) => s.setSidebarTab);

  const [step, setStep] = useState(0);
  const [selectedSize, setSelectedSize] = useState<CardSizePreset>(SIZE_PRESETS.find(p => p.id === 'poker')!);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>(cardTemplates[0]);
  const [themes, setThemes] = useState<GeneratedTheme[]>([]);
  const [selectedThemeIdx, setSelectedThemeIdx] = useState(0);
  const [deckName, setDeckName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setSelectedSize(SIZE_PRESETS.find(p => p.id === 'poker')!);
      setSelectedTemplate(cardTemplates[0]);
      setSelectedThemeIdx(0);
      setDeckName(`Deck ${(manifest?.decks.length || 0) + 1}`);
      generateThemes(cardTemplates[0]);
    }
  }, [open]);

  const generateThemes = useCallback((template: CardTemplate) => {
    const generated: GeneratedTheme[] = [];
    for (let i = 0; i < 4; i++) {
      const palette = generateRichPalette(i);
      const result = applyThemeToTemplate(template, palette, i);
      generated.push({ palette, ...result });
    }
    setThemes(generated);
    setSelectedThemeIdx(0);
  }, []);

  const selectedTheme = themes[selectedThemeIdx];

  const handleSelectTemplate = (t: CardTemplate) => {
    setSelectedTemplate(t);
    generateThemes(t);
  };

  const handleGenerateNewThemes = () => {
    generateThemes(selectedTemplate);
  };

  const handleSelectDeck = useCallback(async (deck: DeckMeta) => {
    if (!projectPath) return;
    setActiveDeck(deck.id);
    const fullPath = `${projectPath}/${deck.path}`;
    await loadTemplate(fullPath);
    await loadData(fullPath, deck);
    await loadCardBack(fullPath);
    setSidebarTab('decks');
  }, [projectPath, setActiveDeck, loadTemplate, loadData, loadCardBack, setSidebarTab]);

  const handleCreate = async () => {
    if (!projectPath || !deckName.trim() || !selectedTheme || creating) return;

    setCreating(true);
    try {
      addDeck(deckName, selectedSize);

      const updatedManifest = useProjectStore.getState().manifest;
      const newDeck = updatedManifest?.decks.find((d: DeckMeta) => d.name === deckName);
      if (!newDeck) { setCreating(false); return; }

      const deckPath = `${projectPath}/${newDeck.path}`;

      await invoke('write_template', { deckPath, html: selectedTheme.html, css: selectedTheme.css });

      const cardPxW = selectedSize.widthMm * 3;
      const cardPxH = selectedSize.heightMm * 3;
      const rawElements = [{
        id: 'raw_template_container',
        type: 'container',
        x: 0, y: 0, width: cardPxW, height: cardPxH,
        rotation: 0, opacity: 1, zIndex: 0, visible: true,
        props: { rawHtml: selectedTheme.html, rawCss: selectedTheme.css },
      }];
      await invoke('write_canvas', { deckPath, content: JSON.stringify(rawElements) });

      if (selectedTemplate.sampleData.length > 0) {
        const headers = Object.keys(selectedTemplate.sampleData[0]);
        const csvContent = [
          headers.join(','),
          ...selectedTemplate.sampleData.map(row =>
            headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`).join(',')
          ),
        ].join('\n');
        await invoke('write_csv_content', { path: `${deckPath}/cards.csv`, content: csvContent });
      }

      await handleSelectDeck(newDeck);
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to create wizard deck:', e);
    }
    setCreating(false);
  };

  const renderStepDots = () => (
    <div className={styles.stepIndicator}>
      {STEPS.map((_label, i) => (
        <div key={i} className={i < step ? styles.stepDotDone : i === step ? styles.stepDotActive : styles.stepDot} title={STEP_LABELS[i]} />
      ))}
    </div>
  );

  const renderSizeStep = () => {
    const grouped = [
      { label: 'Standard', ids: ['poker', 'bridge', 'standard_american', 'euro', 'japanese'] },
      { label: 'Mini / Micro', ids: ['mini_american', 'micro', 'tiny'] },
      { label: 'Large / Square', ids: ['tarot', 'square_70'] },
    ];

    return (
      <div>
        <Text size={400} weight="semibold" style={{ marginBottom: '12px', display: 'block' }}>Choose Card Size</Text>
        {grouped.map(group => (
          <div key={group.label}>
            <div className={styles.categoryLabel}>{group.label}</div>
            <div className={styles.grid3}>
              {SIZE_PRESETS.filter(p => group.ids.includes(p.id)).map(p => (
                <div
                  key={p.id}
                  className={selectedSize.id === p.id ? `${styles.sizeCard} ${styles.sizeCardSelected}` : styles.sizeCard}
                  onClick={() => setSelectedSize(p)}
                >
                  <div className={styles.sizeName}>{p.name}</div>
                  <div className={styles.sizeDim}>{p.widthMm}×{p.heightMm}mm{p.bleedMm > 0 ? ` +${p.bleedMm} bleed` : ''}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLayoutStep = () => (
    <div>
      <Text size={400} weight="semibold" style={{ marginBottom: '12px', display: 'block' }}>Pick a Layout</Text>
      <div className={styles.grid2}>
        {cardTemplates.map(t => (
          <div
            key={t.id}
            className={selectedTemplate.id === t.id ? `${styles.templateCard} ${styles.templateCardSelected}` : styles.templateCard}
            onClick={() => handleSelectTemplate(t)}
          >
            <div className={styles.templateName}>{t.name}</div>
            <div className={styles.templateDesc}>{t.description}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderThemeStep = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <Text size={400} weight="semibold">Choose Color Theme</Text>
        <Button size="small" appearance="outline" onClick={handleGenerateNewThemes}>Generate New</Button>
      </div>
      <div className={styles.themeGrid}>
        {themes.map((t, i) => {
          const p = t.palette;
          return (
            <div
              key={i}
              className={selectedThemeIdx === i ? `${styles.themeCard} ${styles.themeCardSelected}` : styles.themeCard}
              onClick={() => setSelectedThemeIdx(i)}
            >
              <div className={styles.swatches}>
                <div className={styles.swatch} style={{ background: p.front }} title="Front" />
                <div className={styles.swatch} style={{ background: p.back }} title="Back" />
                <div className={styles.swatch} style={{ background: p.background }} title="Background" />
                <div className={styles.swatch} style={{ background: p.outline }} title="Outline" />
                <div className={styles.swatch} style={{ background: p.color }} title="Color" />
              </div>
              <div className={styles.previewSvg} dangerouslySetInnerHTML={{ __html: t.backgroundSvg.substring(0, 1000) + '</svg>' }} />
              <Text size={200} style={{ color: 'var(--mica-text-tertiary)' }}>
                {p.isLightOnDark ? 'Light on dark' : 'Dark on light'}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div>
      <Text size={400} weight="semibold" style={{ marginBottom: '12px', display: 'block' }}>Name & Create</Text>
      <div style={{ marginBottom: '16px' }}>
        <Text size={200} style={{ color: 'var(--mica-text-tertiary)', marginBottom: '6px', display: 'block' }}>Deck Name</Text>
        <input
          type="text" value={deckName} onChange={(e) => setDeckName(e.target.value)}
          className={styles.nameInput} placeholder="Enter deck name" autoFocus
        />
      </div>
      <Text size={200} style={{ color: 'var(--mica-text-tertiary)', marginBottom: '8px', display: 'block' }}>Preview</Text>
      <div className={styles.previewCard} style={{ background: 'var(--mica-layer-2)' }}>
        {selectedTheme && (
          <div dangerouslySetInnerHTML={{ __html: selectedTheme.html }} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
        <Text size={200} style={{ color: 'var(--mica-text-tertiary)' }}>
          {selectedTemplate.name} · {selectedSize.name} ({selectedSize.widthMm}×{selectedSize.heightMm}mm)
        </Text>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(_e, data) => { if (!creating) onOpenChange(data.open); }}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogTitle
          action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => onOpenChange(false)} disabled={creating} />}
          style={{ fontSize: '18px', fontWeight: 700 }}
        >
          Template Wizard — {STEPS[step]}
        </DialogTitle>
        <DialogBody className={styles.dialogBody}>
          {renderStepDots()}
          <div className={styles.content}>
            {step === 0 && renderSizeStep()}
            {step === 1 && renderLayoutStep()}
            {step === 2 && renderThemeStep()}
            {step === 3 && renderReviewStep()}
          </div>
          <div className={styles.actions}>
            <Button
              appearance="subtle"
              icon={<ChevronLeftRegular />}
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0 || creating}
            >
              Back
            </Button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {step < STEPS.length - 1 ? (
                <Button
                  appearance="primary"
                  icon={<ChevronRightRegular />}
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 1 && !selectedTemplate}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  appearance="primary"
                  onClick={handleCreate}
                  disabled={!deckName.trim() || !selectedTheme || creating}
                >
                  {creating ? 'Creating...' : 'Create Deck'}
                </Button>
              )}
            </div>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
