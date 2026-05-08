import { Text, Input, Dropdown, Option, SpinButton, makeStyles, Label, Slider, Button } from '@fluentui/react-components';
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
  const projectPath = useProjectStore((s) => s.projectPath);

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
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <Text size={200} weight="semibold">{type.charAt(0).toUpperCase() + type.slice(1)} Properties</Text>
      {fields}
    </div>
  );
}
