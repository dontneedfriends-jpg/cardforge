import { Text, Input, Dropdown, Option, SpinButton, makeStyles, Label, Slider, Button, Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent } from '@fluentui/react-components';
import { SaveRegular, DeleteRegular } from '@fluentui/react-icons';
import { useCanvasStore } from '../../../store/canvasStore';
import { useDeckStore } from '../../../store';
import { AssetPickerDialog } from '../../assets/AssetPickerDialog';
import { assetPathToRelative } from '../../../shared/utils/assetPath';
import { useProjectStore } from '../../../store';
import { listCustomFonts } from '../../../shared/utils/fontUtils';
import { useState, useEffect } from 'react';

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
    overflow: 'auto',
    height: '100%',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  row: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
});

export function PropertiesPanel() {
  const styles = useStyles();
  const selectedId = useCanvasStore((state) => state.selectedId);
  const elements = useCanvasStore((state) => state.elements);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const updateElementProps = useCanvasStore((state) => state.updateElementProps);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const projectPath = useProjectStore((s) => s.projectPath);
  const presets = useCanvasStore((s) => s.presets);
  const savePreset = useCanvasStore((s) => s.savePreset);
  const applyPreset = useCanvasStore((s) => s.applyPreset);
  const deletePreset = useCanvasStore((s) => s.deletePreset);

  useEffect(() => {
    if (projectPath) listCustomFonts(projectPath).then(setCustomFonts);
  }, [projectPath]);

  // Используем deckData напрямую, чтобы избежать создания нового [] каждый раз
  const deckData = useDeckStore((s) => s.deckData);
  const deckColumns = deckData?.columns ?? [];

  const selectedElement = elements.find((el) => el.id === selectedId);

  if (!selectedElement) {
    return (
      <div className={styles.panel}>
        <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>Select an element to edit its properties</Text>
      </div>
    );
  }

  const { type, props } = selectedElement;

  const handlePropChange = (key: string, value: any) => {
    updateElementProps(selectedElement.id, { [key]: value });
  };

  const handlePositionChange = (key: 'x' | 'y' | 'width' | 'height' | 'rotation' | 'opacity' | 'zIndex', value: number) => {
    updateElement(selectedElement.id, { [key]: value });
  };

  const fields: React.ReactNode[] = [];

  // Position & Size
  fields.push(
    <div className={styles.row} key="pos1">
      <div className={styles.field} style={{ flex: 1 }}>
        <Label size="small">X</Label>
        <SpinButton
          value={selectedElement.x}
          onChange={(_e, data) => { if (data.value != null) handlePositionChange('x', data.value); }}
          size="small"
        />
      </div>
      <div className={styles.field} style={{ flex: 1 }}>
        <Label size="small">Y</Label>
        <SpinButton
          value={selectedElement.y}
          onChange={(_e, data) => { if (data.value != null) handlePositionChange('y', data.value); }}
          size="small"
        />
      </div>
    </div>,
    <div className={styles.row} key="pos2">
      <div className={styles.field} style={{ flex: 1 }}>
        <Label size="small">W</Label>
        <SpinButton
          value={selectedElement.width}
          onChange={(_e, data) => { if (data.value != null) handlePositionChange('width', data.value); }}
          size="small"
        />
      </div>
      <div className={styles.field} style={{ flex: 1 }}>
        <Label size="small">H</Label>
        <SpinButton
          value={selectedElement.height}
          onChange={(_e, data) => { if (data.value != null) handlePositionChange('height', data.value); }}
          size="small"
        />
      </div>
    </div>,
    <div className={styles.row} key="pos3">
      <div className={styles.field} style={{ flex: 1 }}>
        <Label size="small">Rotate</Label>
        <SpinButton
          value={selectedElement.rotation}
          onChange={(_e, data) => { if (data.value != null) handlePositionChange('rotation', data.value); }}
          size="small"
        />
      </div>
      <div className={styles.field} style={{ flex: 1 }}>
        <Label size="small">Z</Label>
        <SpinButton
          value={selectedElement.zIndex}
          onChange={(_e, data) => { if (data.value != null) handlePositionChange('zIndex', data.value); }}
          size="small"
        />
      </div>
    </div>,
    <div className={styles.field} key="opacity">
      <Label size="small">Opacity</Label>
      <Slider
        value={selectedElement.opacity}
        min={0}
        max={1}
        step={0.05}
        onChange={(_e, data) => handlePositionChange('opacity', data.value)}
      />
    </div>
  );

  // Type-specific fields
  if (type === 'text' || type === 'field') {
    fields.push(
      <div className={styles.row} key="typo1">
        <div className={styles.field} style={{ flex: 1 }}>
          <Label size="small">Size</Label>
          <SpinButton
            value={props.fontSize ?? 14}
            onChange={(_e, data) => { if (data.value !== undefined) handlePropChange('fontSize', data.value); }}
            size="small"
          />
        </div>
        <div className={styles.field} style={{ flex: 1 }}>
          <Label size="small">Weight</Label>
          <Dropdown
            value={props.fontWeight ?? 'normal'}
            onOptionSelect={(_e, data) => handlePropChange('fontWeight', data.optionValue || 'normal')}
            size="small"
          >
            <Option value="normal">Normal</Option>
            <Option value="bold">Bold</Option>
          </Dropdown>
        </div>
      </div>,
      <div className={styles.row} key="typo2">
        <div className={styles.field} style={{ flex: 1 }}>
          <Label size="small">Color</Label>
          <Input
            value={props.color ?? '#fff'}
            onChange={(_e, data) => handlePropChange('color', data.value)}
            size="small"
          />
        </div>
        <div className={styles.field} style={{ flex: 1 }}>
          <Label size="small">Align</Label>
          <Dropdown
            value={props.textAlign ?? 'left'}
            onOptionSelect={(_e, data) => handlePropChange('textAlign', data.optionValue || 'left')}
            size="small"
          >
            <Option value="left">Left</Option>
            <Option value="center">Center</Option>
            <Option value="right">Right</Option>
          </Dropdown>
        </div>
      </div>,
      <div className={styles.field} key="font-family">
        <Label size="small">Font Family</Label>
        <Dropdown
          value={props.fontFamily ?? 'inherit'}
          onOptionSelect={(_e, data) => handlePropChange('fontFamily', data.optionValue === 'inherit' ? undefined : data.optionValue)}
          size="small"
        >
          <Option value="inherit">(inherit)</Option>
          <Option value="IBM Plex Sans">IBM Plex Sans</Option>
          <Option value="IBM Plex Mono">IBM Plex Mono</Option>
          <Option value="serif">Serif</Option>
          <Option value="sans-serif">Sans-Serif</Option>
          <Option value="monospace">Monospace</Option>
          {customFonts.map(f => <Option key={f} value={f}>{f}</Option>)}
        </Dropdown>
      </div>,
      <div className={styles.row} key="text-stroke">
        <div className={styles.field} style={{ flex: 1 }}>
          <Label size="small">Stroke</Label>
          <SpinButton
            value={props.textStroke ?? 0}
            min={0} max={10}
            onChange={(_e, data) => { if (data.value !== undefined) handlePropChange('textStroke', data.value); }}
            size="small"
          />
        </div>
        <div className={styles.field} style={{ flex: 1 }}>
          <Label size="small">Stroke Color</Label>
          <Input
            value={props.textStrokeColor ?? '#000000'}
            onChange={(_e, data) => handlePropChange('textStrokeColor', data.value)}
            size="small"
          />
        </div>
      </div>,
      <div className={styles.field} key="text-shadow">
        <Label size="small">Text Shadow</Label>
        <Input
          value={props.textShadow ?? ''}
          onChange={(_e, data) => handlePropChange('textShadow', data.value)}
          size="small"
          placeholder="2px 2px 4px rgba(0,0,0,0.5)"
        />
      </div>
    );
  }

  if (type === 'field') {
    fields.push(
      <div className={styles.field} key="field">
        <Label size="small">Bind to column</Label>
        <Dropdown
          value={props.fieldName ?? 'name'}
          onOptionSelect={(_e, data) => handlePropChange('fieldName', data.optionValue || 'name')}
          size="small"
        >
          {deckColumns.map(c => <Option key={c.id} value={c.name}>{c.name}</Option>)}
        </Dropdown>
      </div>
    );
  }

  if (type === 'image') {
    const columns = deckColumns;
    fields.push(
      <div className={styles.field} key="img-picker">
        <Label size="small">Image Source</Label>
        <div className={styles.row}>
          <Input
            value={props.src ?? ''}
            onChange={(_e, data) => {
              handlePropChange('src', data.value);
              handlePropChange('isField', false);
            }}
            size="small"
            placeholder="assets/image.png"
            style={{ flex: 1 }}
          />
          <Button
            size="small"
            onClick={() => setAssetPickerOpen(true)}
          >
            Browse...
          </Button>
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
      </div>,
      <div className={styles.field} key="img-field">
        <Label size="small">Or bind to column</Label>
        <Dropdown
          value={props.isField ? props.fieldName : '(none)'}
          onOptionSelect={(_e, data) => {
            const val = data.optionValue;
            if (val && val !== '(none)') {
              handlePropChange('fieldName', val);
              handlePropChange('isField', true);
            } else {
              handlePropChange('isField', false);
            }
          }}
          size="small"
          placeholder="Select column"
        >
          <Option value="(none)">(none)</Option>
          {columns.map(c => <Option key={c.id} value={c.name}>{c.name}</Option>)}
        </Dropdown>
      </div>
    );
  }

  if (type === 'shape' || type === 'circle' || type === 'container') {
    fields.push(
      <div className={styles.field} key="bg">
        <Label size="small">Background</Label>
        <Input
          value={props.background ?? props.fill ?? '#444'}
          onChange={(_e, data) => handlePropChange('background', data.value)}
          size="small"
        />
      </div>
    );
    
    if (type === 'shape' || type === 'container') {
      fields.push(
        <div className={styles.field} key="radius">
          <Label size="small">Border Radius</Label>
          <SpinButton
            value={props.borderRadius ?? 0}
            onChange={(_e, data) => { if (data.value !== undefined) handlePropChange('borderRadius', data.value); }}
            size="small"
          />
        </div>
      );
    }
    
    if (type === 'container') {
      fields.push(
        <div className={styles.field} key="padding">
          <Label size="small">Padding</Label>
          <SpinButton
            value={props.padding ?? 8}
            onChange={(_e, data) => { if (data.value !== undefined) handlePropChange('padding', data.value); }}
            size="small"
          />
        </div>
      );
      fields.push(
        <div className={styles.field} key="layout">
          <Label size="small">Layout</Label>
          <Dropdown
            value={props.layout ?? 'free'}
            onOptionSelect={(_e, data) => handlePropChange('layout', data.optionValue || 'free')}
            size="small"
          >
            <Option value="free">Free</Option>
            <Option value="grid">Grid</Option>
            <Option value="stack">Stack</Option>
          </Dropdown>
        </div>
      );
      if (props.layout === 'grid') {
        fields.push(
          <div className={styles.row} key="grid-cols">
            <div className={styles.field} style={{ flex: 1 }}>
              <Label size="small">Columns</Label>
              <SpinButton
                value={props.columns ?? 2}
                min={1} max={12}
                onChange={(_e, data) => { if (data.value !== undefined) handlePropChange('columns', data.value); }}
                size="small"
              />
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <Label size="small">Rows</Label>
              <SpinButton
                value={props.rows ?? 0}
                min={0} max={12}
                onChange={(_e, data) => { if (data.value !== undefined) handlePropChange('rows', data.value); }}
                size="small"
              />
            </div>
          </div>,
          <div className={styles.field} key="grid-gap">
            <Label size="small">Gap</Label>
            <SpinButton
              value={props.gap ?? 4}
              min={0} max={40}
              onChange={(_e, data) => { if (data.value !== undefined) handlePropChange('gap', data.value); }}
              size="small"
            />
          </div>
        );
      }
      if (props.layout === 'stack') {
        fields.push(
          <div className={styles.row} key="stack-dir">
            <div className={styles.field} style={{ flex: 1 }}>
              <Label size="small">Direction</Label>
              <Dropdown
                value={props.direction ?? 'column'}
                onOptionSelect={(_e, data) => handlePropChange('direction', data.optionValue || 'column')}
                size="small"
              >
                <Option value="column">Column</Option>
                <Option value="row">Row</Option>
              </Dropdown>
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <Label size="small">Gap</Label>
              <SpinButton
                value={props.gap ?? 4}
                min={0} max={40}
                onChange={(_e, data) => { if (data.value !== undefined) handlePropChange('gap', data.value); }}
                size="small"
              />
            </div>
          </div>,
          <div className={styles.row} key="stack-align">
            <div className={styles.field} style={{ flex: 1 }}>
              <Label size="small">Align</Label>
              <Dropdown
                value={props.alignItems ?? 'stretch'}
                onOptionSelect={(_e, data) => handlePropChange('alignItems', data.optionValue || 'stretch')}
                size="small"
              >
                <Option value="stretch">Stretch</Option>
                <Option value="start">Start</Option>
                <Option value="center">Center</Option>
                <Option value="end">End</Option>
              </Dropdown>
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <Label size="small">Justify</Label>
              <Dropdown
                value={props.justifyContent ?? 'start'}
                onOptionSelect={(_e, data) => handlePropChange('justifyContent', data.optionValue || 'start')}
                size="small"
              >
                <Option value="start">Start</Option>
                <Option value="center">Center</Option>
                <Option value="end">End</Option>
                <Option value="between">Between</Option>
                <Option value="around">Around</Option>
              </Dropdown>
            </div>
          </div>
        );
      }
    }
    
    fields.push(
      <div className={styles.row} key="border">
        <div className={styles.field} style={{ flex: 1 }}>
          <Label size="small">Border W</Label>
          <SpinButton
            value={props.borderWidth ?? 0}
            onChange={(_e, data) => { if (data.value !== undefined) handlePropChange('borderWidth', data.value); }}
            size="small"
          />
        </div>
        <div className={styles.field} style={{ flex: 1 }}>
          <Label size="small">Color</Label>
          <Input
            value={props.borderColor ?? '#000'}
            onChange={(_e, data) => handlePropChange('borderColor', data.value)}
            size="small"
          />
        </div>
      </div>
    );
  }

  if (type === 'line') {
    fields.push(
      <div className={styles.field} key="line-color">
        <Label size="small">Color</Label>
        <Input
          value={props.color ?? '#fff'}
          onChange={(_e, data) => handlePropChange('color', data.value)}
          size="small"
        />
      </div>,
      <div className={styles.field} key="line-width">
        <Label size="small">Line Width</Label>
        <SpinButton
          value={props.lineWidth ?? 2}
          onChange={(_e, data) => { if (data.value !== undefined) handlePropChange('lineWidth', data.value); }}
          size="small"
        />
      </div>
    );
  }

  if (type === 'icon') {
    const iconOptions = [
      'heart', 'star', 'shield', 'sword', 'bolt', 'fire', 'water', 'leaf',
      'moon', 'sun', 'skull', 'crown', 'gear', 'info', 'warning', 'check', 'cross',
      'arrow_up', 'arrow_down', 'arrow_left', 'arrow_right', 'plus', 'minus',
    ];
    fields.push(
      <div className={styles.field} key="icon-name">
        <Label size="small">Icon</Label>
        <Dropdown
          value={props.iconName ?? 'star'}
          onOptionSelect={(_e, data) => handlePropChange('iconName', data.optionValue || 'star')}
          size="small"
        >
          {iconOptions.map(io => <Option key={io} value={io}>{io}</Option>)}
        </Dropdown>
      </div>,
      <div className={styles.field} key="icon-size">
        <Label size="small">Size</Label>
        <SpinButton
          value={props.iconSize ?? 24}
          onChange={(_e, data) => { if (data.value !== undefined) handlePropChange('iconSize', data.value); }}
          size="small"
        />
      </div>,
      <div className={styles.field} key="icon-color">
        <Label size="small">Color</Label>
        <Input
          value={props.color ?? '#ffffff'}
          onChange={(_e, data) => handlePropChange('color', data.value)}
          size="small"
        />
      </div>
    );
  }

  if (type === 'qr') {
    fields.push(
      <div className={styles.field} key="qr-data">
        <Label size="small">Data</Label>
        <Input
          value={props.data ?? ''}
          onChange={(_e, data) => handlePropChange('data', data.value)}
          size="small"
          placeholder="https://example.com"
        />
      </div>,
      <div className={styles.row} key="qr-options">
        <div className={styles.field} style={{ flex: 1 }}>
          <Label size="small">Size</Label>
          <SpinButton
            value={props.qrSize ?? 100}
            min={20} max={400}
            onChange={(_e, data) => { if (data.value !== undefined) handlePropChange('qrSize', data.value); }}
            size="small"
          />
        </div>
        <div className={styles.field} style={{ flex: 1 }}>
          <Label size="small">ECC</Label>
          <Dropdown
            value={props.errorCorrection ?? 'M'}
            onOptionSelect={(_e, data) => handlePropChange('errorCorrection', data.optionValue || 'M')}
            size="small"
          >
            <Option value="L">L (low)</Option>
            <Option value="M">M (medium)</Option>
            <Option value="Q">Q (high)</Option>
            <Option value="H">H (max)</Option>
          </Dropdown>
        </div>
      </div>,
      <div className={styles.row} key="qr-colors">
        <div className={styles.field} style={{ flex: 1 }}>
          <Label size="small">Color</Label>
          <Input
            value={props.color ?? '#000000'}
            onChange={(_e, data) => handlePropChange('color', data.value)}
            size="small"
          />
        </div>
        <div className={styles.field} style={{ flex: 1 }}>
          <Label size="small">Bg Color</Label>
          <Input
            value={props.bgColor ?? '#ffffff'}
            onChange={(_e, data) => handlePropChange('bgColor', data.value)}
            size="small"
          />
        </div>
      </div>
    );
  }

  const filteredPresets = presets.filter((p) => p.type === type);

  return (
    <div className={styles.panel}>
      <Text size={200} weight="semibold">{type.charAt(0).toUpperCase() + type.slice(1)} Properties</Text>
      {fields}

      <div style={{ borderTop: '1px solid var(--mica-stroke)', paddingTop: '12px', marginTop: '8px' }}>
        <Label size="small">Presets</Label>
        <div className={styles.row} style={{ marginTop: '4px' }}>
          <Button
            size="small"
            icon={<SaveRegular />}
            onClick={() => { setNewPresetName(''); setPresetDialogOpen(true); }}
            style={{ flex: 1 }}
          >
            Save
          </Button>
          {filteredPresets.length > 0 && (
            <Dropdown
              size="small"
              value="Apply..."
              onOptionSelect={(_e, data) => {
                if (data.optionValue) applyPreset(data.optionValue);
              }}
              placeholder="Apply..."
              style={{ flex: 2 }}
            >
              {filteredPresets.map((p) => (
                <Option key={p.id} value={p.id} text={p.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>{p.name}</span>
                    <Button
                      size="small"
                      icon={<DeleteRegular />}
                      appearance="subtle"
                      onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }}
                    />
                  </div>
                </Option>
              ))}
            </Dropdown>
          )}
        </div>
      </div>

      <Dialog open={presetDialogOpen} onOpenChange={(_e, data) => setPresetDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Save Preset</DialogTitle>
            <DialogContent>
              <Input
                placeholder="Preset name"
                value={newPresetName}
                onChange={(_e, data) => setNewPresetName(data.value)}
                autoFocus
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setPresetDialogOpen(false)}>Cancel</Button>
              <Button
                appearance="primary"
                disabled={!newPresetName.trim()}
                onClick={() => {
                  savePreset(newPresetName.trim());
                  setPresetDialogOpen(false);
                }}
              >
                Save
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
