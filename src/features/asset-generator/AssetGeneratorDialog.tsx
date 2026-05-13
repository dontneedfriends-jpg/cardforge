import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions, Button, makeStyles, TabList, Tab, Text, type SelectTabData, type SelectTabEvent } from '@fluentui/react-components';
import { SaveRegular, ArrowSyncRegular } from '@fluentui/react-icons';
import { useProjectStore } from '../../store';
import { invoke } from '@tauri-apps/api/core';
import { generateRandomCardSymbol, generateRandomArt, generateRandomBadge } from './generators/cardSymbolGenerator';
import { generateRandomCardBackground } from './generators/cardBackgroundGenerator';
import { generateRandomBanner, generateRandomTextbox } from './generators/cardTextboxGenerator';
import { ColorGenerator, type ColorPalette } from './generators/colorGenerator';

type AssetType = 'symbol' | 'art' | 'background' | 'badge' | 'banner' | 'textbox';

interface GeneratedItem {
  id: string;
  svg: string;
  palette: ColorPalette;
}

const useStyles = makeStyles({
  content: { display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '400px' },
  tabs: { marginBottom: '4px' },
  previews: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', flex: 1 },
  previewCard: {
    padding: '12px', borderRadius: '8px', background: 'var(--mica-layer-1)',
    border: '2px solid var(--mica-stroke)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '120px', transition: 'all 0.15s ease',
    ':hover': { background: 'var(--mica-layer-2)' },
  },
  previewCardSelected: { background: 'var(--mica-layer-2)' },
  previewSvg: { maxWidth: '100%', maxHeight: '140px' },
  actions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--mica-stroke)' },
  options: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', borderRadius: '8px', background: 'var(--mica-base)' },
  optionLabel: { fontSize: '12px', color: 'var(--mica-text-secondary)', marginBottom: '4px' },
  empty: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: 'var(--mica-text-tertiary)', gridColumn: '1 / -1' },
});

const ASSET_TYPE_LABELS: Record<AssetType, { label: string; filename: string; count: number }> = {
  symbol: { label: 'Symbol', filename: 'generated-symbol', count: 6 },
  art: { label: 'Art', filename: 'generated-art', count: 6 },
  background: { label: 'Background', filename: 'generated-background', count: 6 },
  badge: { label: 'Badge', filename: 'generated-badge', count: 6 },
  banner: { label: 'Banner', filename: 'generated-banner', count: 6 },
  textbox: { label: 'Textbox', filename: 'generated-textbox', count: 6 },
};

function generateSet(type: AssetType): GeneratedItem[] {
  const items: GeneratedItem[] = [];
  const palette = ColorGenerator.generateHarmoniousPalette();
  const count = ASSET_TYPE_LABELS[type].count;

  for (let i = 0; i < count; i++) {
    let svg = '';
    switch (type) {
      case 'symbol': svg = generateRandomCardSymbol({ palette, width: 100, height: 100 }); break;
      case 'art': svg = generateRandomArt(palette); break;
      case 'background': svg = generateRandomCardBackground({ width: 300, height: 420 }); break;
      case 'badge': svg = generateRandomBadge(palette); break;
      case 'banner': svg = generateRandomBanner({ palette }); break;
      case 'textbox': svg = generateRandomTextbox({ palette }); break;
    }
    items.push({ id: `${type}-${i}-${Math.random().toString(36).substr(2, 6)}`, svg, palette });
  }
  return items;
}

export function AssetGeneratorDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; onSaved?: () => void }) {
  const styles = useStyles();
  const projectPath = useProjectStore((s) => s.projectPath);
  const [assetType, setAssetType] = useState<AssetType>('symbol');
  const [items, setItems] = useState<GeneratedItem[]>(() => generateSet('symbol'));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = useMemo(() => items.find(i => i.id === selectedId), [items, selectedId]);

  const handleTypeChange = useCallback((_e: SelectTabEvent, data: SelectTabData) => {
    const type = data.value as AssetType;
    setAssetType(type);
    setItems(generateSet(type));
    setSelectedId(null);
    setError(null);
  }, []);

  const handleRegenerate = useCallback(() => {
    setItems(generateSet(assetType));
    setSelectedId(null);
    setError(null);
  }, [assetType]);

  const handleSave = useCallback(async () => {
    if (!projectPath || !selectedItem) return;
    setSaving(true);
    setError(null);
    try {
      const info = ASSET_TYPE_LABELS[assetType];
      const filename = `${info.filename}-${Date.now()}.svg`;
      await invoke('write_asset_file', { projectPath, filename, content: selectedItem.svg });
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      setError(`Failed to save: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  }, [projectPath, selectedItem, assetType, onSaved, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(_e, data) => onOpenChange(data.open)}>
      <DialogSurface style={{ maxWidth: '640px' }}>
        <DialogBody>
          <DialogTitle>Generate Asset</DialogTitle>
          <DialogContent className={styles.content}>
            <TabList selectedValue={assetType} onTabSelect={handleTypeChange} className={styles.tabs}>
              <Tab value="symbol">Symbol</Tab>
              <Tab value="art">Art</Tab>
              <Tab value="background">Background</Tab>
              <Tab value="badge">Badge</Tab>
              <Tab value="banner">Banner</Tab>
              <Tab value="textbox">Textbox</Tab>
            </TabList>

            <div className={styles.previews}>
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.previewCard} ${selectedId === item.id ? styles.previewCardSelected : ''}`}
                  onClick={() => setSelectedId(item.id)}
                  dangerouslySetInnerHTML={{ __html: item.svg }}
                />
              ))}
            </div>

            {error && <Text style={{ color: 'var(--mica-error)' }} size={200}>{error}</Text>}

            <div className={styles.actions}>
              <Button icon={<ArrowSyncRegular />} appearance="outline" onClick={handleRegenerate}>
                Generate New Set
              </Button>
              <Button icon={<SaveRegular />} appearance="primary" onClick={handleSave} disabled={!selectedItem || saving}>
                {saving ? 'Saving...' : 'Save Selected'}
              </Button>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
