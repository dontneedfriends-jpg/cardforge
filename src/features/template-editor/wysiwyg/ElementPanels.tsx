import { Input, Dropdown, Option, SpinButton, makeStyles, mergeClasses, Label } from '@fluentui/react-components';
import type { ElementProps } from '../../../store/canvasStore';
import { useState, useEffect } from 'react';

const useStyles = makeStyles({
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  flexField: { flex: 1 },
  row: { display: 'flex', gap: '8px', alignItems: 'center' },
});

function SmartInput({ value, onChange, onBlur, placeholder, className }: { value: string; onChange: (val: string) => void; onBlur?: () => void; placeholder?: string; className?: string }) {
  const [local, setLocal] = useState(value);

  useEffect(() => { setLocal(value); }, [value]);

  return (
    <Input
      value={local}
      onChange={(_e, data) => setLocal(data.value)}
      onBlur={() => { onChange(local); onBlur?.(); }}
      size="small"
      placeholder={placeholder}
      className={className}
    />
  );
}

export function TextPanel({ props, onPropChange, onBlur, customFonts = [] }: { props: ElementProps; onPropChange: (key: keyof ElementProps, value: string | number | boolean | null | undefined) => void; onBlur?: () => void; customFonts?: string[] }) {
  const s = useStyles();
  return (
    <>
      <div className={s.row}>
        <div className={mergeClasses(s.field, s.flexField)}>
          <Label size="small">Size</Label>
          <SpinButton value={(props as any).fontSize ?? 14} onChange={(_e, data) => { if (data.value !== undefined) onPropChange('fontSize', data.value); }} size="small" />
        </div>
        <div className={mergeClasses(s.field, s.flexField)}>
          <Label size="small">Weight</Label>
          <Dropdown value={(props as any).fontWeight ?? 'normal'} onOptionSelect={(_e, data) => onPropChange('fontWeight', data.optionValue || 'normal')} size="small">
            <Option value="normal">Normal</Option>
            <Option value="bold">Bold</Option>
          </Dropdown>
        </div>
      </div>
      <div className={s.row}>
        <div className={mergeClasses(s.field, s.flexField)}>
          <Label size="small">Color</Label>
          <SmartInput value={(props as any).color ?? '#fff'} onChange={(v) => onPropChange('color', v)} onBlur={onBlur} />
        </div>
        <div className={mergeClasses(s.field, s.flexField)}>
          <Label size="small">Align</Label>
          <Dropdown value={(props as any).textAlign ?? 'left'} onOptionSelect={(_e, data) => onPropChange('textAlign', data.optionValue || 'left')} size="small">
            <Option value="left">Left</Option>
            <Option value="center">Center</Option>
            <Option value="right">Right</Option>
          </Dropdown>
        </div>
      </div>
      <div className={s.field}>
        <Label size="small">Font Family</Label>
        <Dropdown value={(props as any).fontFamily ?? 'inherit'} onOptionSelect={(_e, data) => onPropChange('fontFamily', data.optionValue === 'inherit' ? undefined : data.optionValue)} size="small">
          <Option value="inherit">(inherit)</Option>
          <Option value="IBM Plex Sans">IBM Plex Sans</Option>
          <Option value="IBM Plex Mono">IBM Plex Mono</Option>
          <Option value="serif">Serif</Option>
          <Option value="sans-serif">Sans-Serif</Option>
          <Option value="monospace">Monospace</Option>
          {customFonts.map(f => <Option key={f} value={f}>{f}</Option>)}
        </Dropdown>
      </div>
      <div className={s.row}>
        <div className={mergeClasses(s.field, s.flexField)}>
          <Label size="small">Stroke</Label>
          <SpinButton value={(props as any).textStroke ?? 0} min={0} max={10} onChange={(_e, data) => { if (data.value !== undefined) onPropChange('textStroke', data.value); }} size="small" />
        </div>
        <div className={mergeClasses(s.field, s.flexField)}>
          <Label size="small">Stroke Color</Label>
          <SmartInput value={(props as any).textStrokeColor ?? '#000000'} onChange={(v) => onPropChange('textStrokeColor', v)} onBlur={onBlur} />
        </div>
      </div>
      <div className={s.field}>
        <Label size="small">Text Shadow</Label>
        <SmartInput value={(props as any).textShadow ?? ''} onChange={(v) => onPropChange('textShadow', v)} onBlur={onBlur} placeholder="2px 2px 4px rgba(0,0,0,0.5)" />
      </div>
    </>
  );
}

export function FieldPanel({ props, onPropChange, onBlur, columns, customFonts = [] }: { props: ElementProps; onPropChange: (key: keyof ElementProps, value: string | number | boolean | null | undefined) => void; onBlur?: () => void; columns: { id: string; name: string }[]; customFonts?: string[] }) {
  const s = useStyles();
  return (
    <>
      <TextPanel props={props} onPropChange={onPropChange as any} onBlur={onBlur} customFonts={customFonts} />
      <div className={s.field}>
        <Label size="small">Bind to column</Label>
        <Dropdown value={(props as any).fieldName ?? 'name'} onOptionSelect={(_e, data) => onPropChange('fieldName', data.optionValue || 'name')} size="small">
          {columns.map(c => <Option key={c.id} value={c.name}>{c.name}</Option>)}
        </Dropdown>
      </div>
    </>
  );
}

export function ImagePanel({ props, onPropChange, onBlur, columns }: { props: ElementProps; onPropChange: (key: keyof ElementProps, value: string | number | boolean | null | undefined) => void; onBlur?: () => void; columns: { id: string; name: string }[] }) {
  const s = useStyles();
  return (
    <>
      <div className={s.field}>
        <Label size="small">Image Source</Label>
        <div className={s.row}>
          <SmartInput value={(props as any).src ?? ''} onChange={(v) => { onPropChange('src', v); onPropChange('isField', false); }} onBlur={onBlur} placeholder="assets/image.png" className={s.flexField} />
        </div>
      </div>
      <div className={s.field}>
        <Label size="small">Or bind to column</Label>
        <Dropdown value={(props as any).isField ? (props as any).fieldName : '(none)'} onOptionSelect={(_e, data) => {
          const val = data.optionValue;
          if (val && val !== '(none)') { onPropChange('fieldName', val); onPropChange('isField', true); }
          else { onPropChange('isField', false); }
        }} size="small" placeholder="Select column">
          <Option value="(none)">(none)</Option>
          {columns.map(c => <Option key={c.id} value={c.name}>{c.name}</Option>)}
        </Dropdown>
      </div>
    </>
  );
}

export function ShapePanel({ props, onPropChange, onBlur }: { props: ElementProps; onPropChange: (key: keyof ElementProps, value: string | number | boolean | null | undefined) => void; onBlur?: () => void }) {
  const s = useStyles();
  return (
    <>
      <div className={s.field}>
        <Label size="small">Background</Label>
        <SmartInput value={(props as any).background ?? (props as any).fill ?? '#444'} onChange={(v) => onPropChange('background', v)} onBlur={onBlur} />
      </div>
      <div className={s.field}>
        <Label size="small">Border Radius</Label>
        <SpinButton value={(props as any).borderRadius ?? 0} onChange={(_e, data) => { if (data.value !== undefined) onPropChange('borderRadius', data.value); }} size="small" />
      </div>
      <BorderPanel props={props} onPropChange={onPropChange} onBlur={onBlur} />
    </>
  );
}

export function CirclePanel({ props, onPropChange, onBlur }: { props: ElementProps; onPropChange: (key: keyof ElementProps, value: string | number | boolean | null | undefined) => void; onBlur?: () => void }) {
  const s = useStyles();
  return (
    <>
      <div className={s.field}>
        <Label size="small">Background</Label>
        <SmartInput value={(props as any).background ?? '#444'} onChange={(v) => onPropChange('background', v)} onBlur={onBlur} />
      </div>
      <BorderPanel props={props} onPropChange={onPropChange} onBlur={onBlur} />
    </>
  );
}

export function ContainerPanel({ props, onPropChange, onBlur }: { props: ElementProps; onPropChange: (key: keyof ElementProps, value: string | number | boolean | null | undefined) => void; onBlur?: () => void }) {
  const s = useStyles();
  return (
    <>
      <div className={s.field}>
        <Label size="small">Background</Label>
        <SmartInput value={(props as any).background ?? (props as any).fill ?? '#444'} onChange={(v) => onPropChange('background', v)} onBlur={onBlur} />
      </div>
      <div className={s.field}>
        <Label size="small">Padding</Label>
        <SpinButton value={(props as any).padding ?? 8} onChange={(_e, data) => { if (data.value !== undefined) onPropChange('padding', data.value); }} size="small" />
      </div>
      <div className={s.field}>
        <Label size="small">Layout</Label>
        <Dropdown value={(props as any).layout ?? 'free'} onOptionSelect={(_e, data) => onPropChange('layout', data.optionValue || 'free')} size="small">
          <Option value="free">Free</Option>
          <Option value="grid">Grid</Option>
          <Option value="stack">Stack</Option>
        </Dropdown>
      </div>
      {(props as any).layout === 'grid' && (
        <>
          <div className={s.row}>
            <div className={mergeClasses(s.field, s.flexField)}>
              <Label size="small">Columns</Label>
              <SpinButton value={(props as any).columns ?? 2} min={1} max={12} onChange={(_e, data) => { if (data.value !== undefined) onPropChange('columns', data.value); }} size="small" />
            </div>
            <div className={mergeClasses(s.field, s.flexField)}>
              <Label size="small">Rows</Label>
              <SpinButton value={(props as any).rows ?? 0} min={0} max={12} onChange={(_e, data) => { if (data.value !== undefined) onPropChange('rows', data.value); }} size="small" />
            </div>
          </div>
          <div className={s.field}>
            <Label size="small">Gap</Label>
            <SpinButton value={(props as any).gap ?? 4} min={0} max={40} onChange={(_e, data) => { if (data.value !== undefined) onPropChange('gap', data.value); }} size="small" />
          </div>
        </>
      )}
      {(props as any).layout === 'stack' && (
        <>
          <div className={s.row}>
            <div className={mergeClasses(s.field, s.flexField)}>
              <Label size="small">Direction</Label>
              <Dropdown value={(props as any).direction ?? 'column'} onOptionSelect={(_e, data) => onPropChange('direction', data.optionValue || 'column')} size="small">
                <Option value="column">Column</Option>
                <Option value="row">Row</Option>
              </Dropdown>
            </div>
            <div className={mergeClasses(s.field, s.flexField)}>
              <Label size="small">Gap</Label>
              <SpinButton value={(props as any).gap ?? 4} min={0} max={40} onChange={(_e, data) => { if (data.value !== undefined) onPropChange('gap', data.value); }} size="small" />
            </div>
          </div>
          <div className={s.row}>
            <div className={mergeClasses(s.field, s.flexField)}>
              <Label size="small">Align</Label>
              <Dropdown value={(props as any).alignItems ?? 'stretch'} onOptionSelect={(_e, data) => onPropChange('alignItems', data.optionValue || 'stretch')} size="small">
                <Option value="stretch">Stretch</Option>
                <Option value="start">Start</Option>
                <Option value="center">Center</Option>
                <Option value="end">End</Option>
              </Dropdown>
            </div>
            <div className={mergeClasses(s.field, s.flexField)}>
              <Label size="small">Justify</Label>
              <Dropdown value={(props as any).justifyContent ?? 'start'} onOptionSelect={(_e, data) => onPropChange('justifyContent', data.optionValue || 'start')} size="small">
                <Option value="start">Start</Option>
                <Option value="center">Center</Option>
                <Option value="end">End</Option>
                <Option value="between">Between</Option>
                <Option value="around">Around</Option>
              </Dropdown>
            </div>
          </div>
        </>
      )}
      <BorderPanel props={props} onPropChange={onPropChange} onBlur={onBlur} />
    </>
  );
}

function BorderPanel({ props, onPropChange, onBlur }: { props: ElementProps; onPropChange: (key: keyof ElementProps, value: string | number | boolean | null | undefined) => void; onBlur?: () => void }) {
  const s = useStyles();
  return (
    <div className={s.row}>
      <div className={mergeClasses(s.field, s.flexField)}>
        <Label size="small">Border W</Label>
        <SpinButton value={(props as any).borderWidth ?? 0} onChange={(_e, data) => { if (data.value !== undefined) onPropChange('borderWidth', data.value); }} size="small" />
      </div>
      <div className={mergeClasses(s.field, s.flexField)}>
        <Label size="small">Color</Label>
        <SmartInput value={(props as any).borderColor ?? '#000'} onChange={(v) => onPropChange('borderColor', v)} onBlur={onBlur} />
      </div>
    </div>
  );
}

export function LinePanel({ props, onPropChange, onBlur }: { props: ElementProps; onPropChange: (key: keyof ElementProps, value: string | number | boolean | null | undefined) => void; onBlur?: () => void }) {
  const s = useStyles();
  return (
    <>
      <div className={s.field}>
        <Label size="small">Color</Label>
        <SmartInput value={(props as any).color ?? '#fff'} onChange={(v) => onPropChange('color', v)} onBlur={onBlur} />
      </div>
      <div className={s.field}>
        <Label size="small">Line Width</Label>
        <SpinButton value={(props as any).lineWidth ?? 2} onChange={(_e, data) => { if (data.value !== undefined) onPropChange('lineWidth', data.value); }} size="small" />
      </div>
    </>
  );
}

export function IconPanel({ props, onPropChange, onBlur }: { props: ElementProps; onPropChange: (key: keyof ElementProps, value: string | number | boolean | null | undefined) => void; onBlur?: () => void }) {
  const iconOptions = ['heart', 'star', 'shield', 'sword', 'bolt', 'fire', 'water', 'leaf', 'moon', 'sun', 'skull', 'crown', 'gear', 'info', 'warning', 'check', 'cross', 'arrow_up', 'arrow_down', 'arrow_left', 'arrow_right', 'plus', 'minus'];
  const s = useStyles();
  return (
    <>
      <div className={s.field}>
        <Label size="small">Icon</Label>
        <Dropdown value={(props as any).iconName ?? 'star'} onOptionSelect={(_e, data) => onPropChange('iconName', data.optionValue || 'star')} size="small">
          {iconOptions.map(io => <Option key={io} value={io}>{io}</Option>)}
        </Dropdown>
      </div>
      <div className={s.field}>
        <Label size="small">Size</Label>
        <SpinButton value={(props as any).iconSize ?? 24} onChange={(_e, data) => { if (data.value !== undefined) onPropChange('iconSize', data.value); }} size="small" />
      </div>
      <div className={s.field}>
        <Label size="small">Color</Label>
        <SmartInput value={(props as any).color ?? '#ffffff'} onChange={(v) => onPropChange('color', v)} onBlur={onBlur} />
      </div>
    </>
  );
}

export function QrPanel({ props, onPropChange, onBlur }: { props: ElementProps; onPropChange: (key: keyof ElementProps, value: string | number | boolean | null | undefined) => void; onBlur?: () => void }) {
  const s = useStyles();
  return (
    <>
      <div className={s.field}>
        <Label size="small">Data</Label>
        <SmartInput value={(props as any).data ?? ''} onChange={(v) => onPropChange('data', v)} onBlur={onBlur} placeholder="https://example.com" />
      </div>
      <div className={s.row}>
        <div className={mergeClasses(s.field, s.flexField)}>
          <Label size="small">Size</Label>
          <SpinButton value={(props as any).qrSize ?? 100} min={20} max={400} onChange={(_e, data) => { if (data.value !== undefined) onPropChange('qrSize', data.value); }} size="small" />
        </div>
        <div className={mergeClasses(s.field, s.flexField)}>
          <Label size="small">ECC</Label>
          <Dropdown value={(props as any).errorCorrection ?? 'M'} onOptionSelect={(_e, data) => onPropChange('errorCorrection', data.optionValue || 'M')} size="small">
            <Option value="L">L (low)</Option>
            <Option value="M">M (medium)</Option>
            <Option value="Q">Q (high)</Option>
            <Option value="H">H (max)</Option>
          </Dropdown>
        </div>
      </div>
      <div className={s.row}>
        <div className={mergeClasses(s.field, s.flexField)}>
          <Label size="small">Color</Label>
          <SmartInput value={(props as any).color ?? '#000000'} onChange={(v) => onPropChange('color', v)} onBlur={onBlur} />
        </div>
        <div className={mergeClasses(s.field, s.flexField)}>
          <Label size="small">Bg Color</Label>
          <SmartInput value={(props as any).bgColor ?? '#ffffff'} onChange={(v) => onPropChange('bgColor', v)} onBlur={onBlur} />
        </div>
      </div>
    </>
  );
}
