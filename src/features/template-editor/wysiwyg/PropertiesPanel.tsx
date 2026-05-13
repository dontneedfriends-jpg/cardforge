import { Text, Input, Dropdown, Option, SpinButton, makeStyles, mergeClasses, Label, Slider, Button, Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent } from '@fluentui/react-components';
import { AssetPickerDialog } from '../../assets/AssetPickerDialog';
import { assetPathToRelative } from '../../../shared/utils/assetPath';
import { SaveRegular, DeleteRegular } from '@fluentui/react-icons';
import { useCanvasStore, type ElementProps } from '../../../store/canvasStore';
import { useDeckStore } from '../../../store';
import { useProjectStore } from '../../../store';
import { listCustomFonts } from '../../../shared/utils/fontUtils';
import { useState, useEffect, useRef, useCallback } from 'react';
import { TextPanel, FieldPanel, ImagePanel, ShapePanel, CirclePanel, ContainerPanel, LinePanel, IconPanel, QrPanel } from './ElementPanels';

const useStyles = makeStyles({
  panel: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', overflow: 'auto', height: '100%' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  flexField: { flex: 1 },
  grow: { flex: 1 },
  row: { display: 'flex', gap: '8px', alignItems: 'center' },
});

function useDebouncedCommit(elementId: string | null, updateElementProps: (id: string, props: Partial<ElementProps>) => void) {
  const pendingRef = useRef<Partial<ElementProps> | null>(null);
  const [draft, setDraft] = useState<ElementProps>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (pendingRef.current && elementId) {
      updateElementProps(elementId, pendingRef.current);
      pendingRef.current = null;
    }
  }, [elementId, updateElementProps]);

  const schedule = useCallback((props: Partial<ElementProps>) => {
    pendingRef.current = { ...pendingRef.current, ...props };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 250);
  }, [flush]);

  const commitNow = useCallback((key: keyof ElementProps, value: unknown) => {
    if (elementId) {
      updateElementProps(elementId, { [key]: value });
    }
  }, [elementId, updateElementProps]);

  return { draft, setDraft, schedule, flush, commitNow };
}

export function PropertiesPanel() {
  const styles = useStyles();
  const selectedId = useCanvasStore((state) => state.selectedId);
  const elements = useCanvasStore((state) => state.elements);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const updateElementProps = useCanvasStore((state) => state.updateElementProps);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const projectPath = useProjectStore((s) => s.projectPath);
  const presets = useCanvasStore((s) => s.presets);
  const savePreset = useCanvasStore((s) => s.savePreset);
  const applyPreset = useCanvasStore((s) => s.applyPreset);
  const deletePreset = useCanvasStore((s) => s.deletePreset);
  const [customFonts, setCustomFonts] = useState<string[]>([]);

  useEffect(() => {
    if (projectPath) listCustomFonts(projectPath).then(setCustomFonts);
  }, [projectPath]);

  const deckData = useDeckStore((s) => s.deckData);
  const deckColumns = deckData?.columns ?? [];

  const selectedElement = elements.find((el) => el.id === selectedId);

  const { setDraft, schedule, flush, commitNow } = useDebouncedCommit(selectedId, updateElementProps);

  useEffect(() => {
    setDraft(selectedElement?.props ?? {});
    flush();
  }, [selectedElement?.id]);

  if (!selectedElement) {
    return (
      <div className={styles.panel}>
        <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>Select an element to edit its properties</Text>
      </div>
    );
  }

  const { type, props } = selectedElement;

  const handlePropChange = (key: keyof ElementProps, value: string | number | boolean | null | undefined) => {
    if (typeof value === 'string') {
      schedule({ [key]: value });
    } else {
      commitNow(key, value);
    }
  };

  const handlePropBlur = () => {
    flush();
  };

  const handlePositionChange = (key: 'x' | 'y' | 'width' | 'height' | 'rotation' | 'opacity' | 'zIndex', value: number) => {
    updateElement(selectedElement.id, { [key]: value });
  };

  const positionFields = (
    <>
      <div className={styles.row}>
        <div className={mergeClasses(styles.field, styles.flexField)}>
          <Label size="small">X</Label>
          <SpinButton value={selectedElement.x} onChange={(_e, data) => { if (data.value != null) handlePositionChange('x', data.value); }} size="small" />
        </div>
        <div className={mergeClasses(styles.field, styles.flexField)}>
          <Label size="small">Y</Label>
          <SpinButton value={selectedElement.y} onChange={(_e, data) => { if (data.value != null) handlePositionChange('y', data.value); }} size="small" />
        </div>
      </div>
      <div className={styles.row}>
        <div className={mergeClasses(styles.field, styles.flexField)}>
          <Label size="small">W</Label>
          <SpinButton value={selectedElement.width} onChange={(_e, data) => { if (data.value != null) handlePositionChange('width', data.value); }} size="small" />
        </div>
        <div className={mergeClasses(styles.field, styles.flexField)}>
          <Label size="small">H</Label>
          <SpinButton value={selectedElement.height} onChange={(_e, data) => { if (data.value != null) handlePositionChange('height', data.value); }} size="small" />
        </div>
      </div>
      <div className={styles.row}>
        <div className={mergeClasses(styles.field, styles.flexField)}>
          <Label size="small">Rotate</Label>
          <SpinButton value={selectedElement.rotation} onChange={(_e, data) => { if (data.value != null) handlePositionChange('rotation', data.value); }} size="small" />
        </div>
        <div className={mergeClasses(styles.field, styles.flexField)}>
          <Label size="small">Z</Label>
          <SpinButton value={selectedElement.zIndex} onChange={(_e, data) => { if (data.value != null) handlePositionChange('zIndex', data.value); }} size="small" />
        </div>
      </div>
      <div className={styles.field}>
        <Label size="small">Opacity</Label>
        <Slider value={selectedElement.opacity} min={0} max={1} step={0.05} onChange={(_e, data) => handlePositionChange('opacity', data.value)} />
      </div>
    </>
  );

  const typePanel = (() => {
    switch (type) {
      case 'text': return <TextPanel props={props} onPropChange={handlePropChange} onBlur={handlePropBlur} customFonts={customFonts} />;
      case 'field': return <FieldPanel props={props} onPropChange={handlePropChange} onBlur={handlePropBlur} columns={deckColumns} customFonts={customFonts} />;
      case 'image': return <ImagePanel props={props} onPropChange={handlePropChange} onBlur={handlePropBlur} columns={deckColumns} />;
      case 'shape': return <ShapePanel props={props} onPropChange={handlePropChange} onBlur={handlePropBlur} />;
      case 'circle': return <CirclePanel props={props} onPropChange={handlePropChange} onBlur={handlePropBlur} />;
      case 'container': return <ContainerPanel props={props} onPropChange={handlePropChange} onBlur={handlePropBlur} />;
      case 'line': return <LinePanel props={props} onPropChange={handlePropChange} onBlur={handlePropBlur} />;
      case 'icon': return <IconPanel props={props} onPropChange={handlePropChange} onBlur={handlePropBlur} />;
      case 'qr': return <QrPanel props={props} onPropChange={handlePropChange} onBlur={handlePropBlur} />;
    }
  })();

  const filteredPresets = presets.filter((p) => p.type === type);

  return (
    <div className={styles.panel}>
      <Text size={200} weight="semibold">{type.charAt(0).toUpperCase() + type.slice(1)} Properties</Text>
      {positionFields}
      {typePanel}

      <div style={{ borderTop: '1px solid var(--mica-stroke)', paddingTop: '12px', marginTop: '8px' }}>
        <Label size="small">Presets</Label>
        <div className={styles.row} style={{ marginTop: '4px' }}>
          <Button size="small" icon={<SaveRegular />} onClick={() => { setNewPresetName(''); setPresetDialogOpen(true); }} className={styles.grow}>
            Save
          </Button>
          {filteredPresets.length > 0 && (
            <Dropdown
              size="small"
              value="Apply..."
              onOptionSelect={(_e, data) => { if (data.optionValue) applyPreset(data.optionValue); }}
              placeholder="Apply..."
              style={{ flex: 2 }}
            >
              {filteredPresets.map((p) => (
                <Option key={p.id} value={p.id} text={p.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>{p.name}</span>
                    <Button size="small" icon={<DeleteRegular />} appearance="subtle" onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }} />
                  </div>
                </Option>
              ))}
            </Dropdown>
          )}
        </div>
      </div>

      <AssetPickerDialog
        open={assetPickerOpen}
        onOpenChange={setAssetPickerOpen}
        onSelect={(assetPath) => {
          handlePropChange('src', assetPathToRelative(assetPath));
          handlePropChange('isField', false);
        }}
        title="Select Image Asset"
      />

      <Dialog open={presetDialogOpen} onOpenChange={(_e, data) => setPresetDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Save Preset</DialogTitle>
            <DialogContent>
              <Input placeholder="Preset name" value={newPresetName} onChange={(_e, data) => setNewPresetName(data.value)} autoFocus />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setPresetDialogOpen(false)}>Cancel</Button>
              <Button appearance="primary" disabled={!newPresetName.trim()} onClick={() => { savePreset(newPresetName.trim()); setPresetDialogOpen(false); }}>
                Save
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
