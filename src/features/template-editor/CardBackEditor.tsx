import {
  Text, makeStyles, Input, Slider, Dropdown, Option, Button, Label, tokens, Tooltip
} from '@fluentui/react-components';
import { SaveRegular, ArrowUndoRegular, ArrowRedoRegular } from '@fluentui/react-icons';
import { useEditorStore } from '../../store';
import type { CardBackDesign } from '../../shared/types/project';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    height: '100%',
    gap: '0px',
  },
  panel: {
    flex: 1,
    padding: '24px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fieldRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  colorRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  colorInput: {
    width: '40px',
    height: '32px',
    padding: '0',
    border: 'none',
    cursor: 'pointer',
    background: 'none',
  },
  inputGrow: {
    flex: 1,
  },
  previewPanel: {
    width: '360px',
    minWidth: '360px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground2,
  },
  previewCard: {
    width: '200px',
    height: '280px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 0',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '6px',
  },
  iconBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: tokens.colorNeutralBackground3,
    transition: 'all 0.15s ease',
    ':hover': {
      background: tokens.colorNeutralBackground1Hover,
    },
  },
  // selected state handled via inline style
});

const patternOptions = [
  { value: 'none', label: 'None' },
  { value: 'stripes', label: 'Stripes' },
  { value: 'dots', label: 'Dots' },
  { value: 'crosshatch', label: 'Crosshatch' },
];

const symbolPresets = [
  { label: 'None', value: 'none', char: '' },
  { label: 'Star', value: 'star', char: '★' },
  { label: 'Heart', value: 'heart', char: '♥' },
  { label: 'Diamond', value: 'diamond', char: '♦' },
  { label: 'Club', value: 'club', char: '♣' },
  { label: 'Spade', value: 'spade', char: '♠' },
  { label: 'Cross', value: 'cross', char: '✧' },
  { label: 'Circle', value: 'circle', char: '●' },
  { label: 'Triangle', value: 'triangle', char: '▲' },
  { label: 'Moon', value: 'moon', char: '☽' },
  { label: 'Sun', value: 'sun', char: '☀' },
  { label: 'Infinity', value: 'infinity', char: '∞' },
];

import { getPatternCss } from '../../shared/utils/patternCss';

const PRESET_COLORS = [
  { label: 'Dark Navy', top: '#1a0a2e', mid: '#1f1240', bottom: '#2a1a4e' },
  { label: 'Crimson', top: '#2e0a0a', mid: '#401212', bottom: '#4e1a1a' },
  { label: 'Deep Green', top: '#0a2e1a', mid: '#124020', bottom: '#1a4e2a' },
  { label: 'Royal Purple', top: '#1a0a3e', mid: '#221250', bottom: '#301a5e' },
  { label: 'Shadow Black', top: '#111111', mid: '#1a1a1a', bottom: '#222222' },
  { label: 'Midnight Blue', top: '#0a1628', mid: '#0e1e38', bottom: '#142848' },
];

export function CardBackEditor() {
  const styles = useStyles();
  const cardBack = useEditorStore((s) => s.cardBack);
  const setCardBack = useEditorStore((s) => s.setCardBack);
  const undoCardBack = useEditorStore((s) => s.undoCardBack);
  const redoCardBack = useEditorStore((s) => s.redoCardBack);
  const pastCardBacks = useEditorStore((s) => s.pastCardBacks);
  const futureCardBacks = useEditorStore((s) => s.futureCardBacks);
  const saveCardBack = useEditorStore((s) => s.saveCardBack);
  const isDirty = useEditorStore((s) => s.isDirty);

  const update = (partial: Partial<CardBackDesign>) => {
    setCardBack({ ...cardBack, ...partial });
  };

  const patternCss = getPatternCss(cardBack.pattern, cardBack.patternColor, cardBack.patternOpacity);

  const selectedPreset = symbolPresets.find(p => p.value === cardBack.symbolSet);

  const colorField = (label: string, key: keyof CardBackDesign) => (
    <div className={styles.fieldRow}>
      <Label size="small">{label}</Label>
      <div className={styles.colorRow}>
        <input
          type="color"
          value={typeof cardBack[key] === 'string' && (cardBack[key] as string).startsWith('#') ? cardBack[key] as string : '#ffffff'}
          onChange={(e) => update({ [key]: e.target.value })}
          className={styles.colorInput}
        />
        <Input
          size="small"
          value={cardBack[key] as string}
          onChange={(_, d) => update({ [key]: d.value })}
          className={styles.inputGrow}
        />
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <Text size={500} weight="semibold">Card Back Design</Text>

        <div className={styles.section}>
          <Text size={400} weight="semibold">Gradient</Text>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((p) => (
              <Tooltip key={p.label} content={p.label} relationship="label">
                <button
                  style={{
                    width: '24px', height: '24px', borderRadius: '6px', border: '2px solid transparent',
                    background: `linear-gradient(135deg, ${p.top} 0%, ${p.mid} 50%, ${p.bottom} 100%)`,
                    cursor: 'pointer',
                    outline: cardBack.backgroundTop === p.top ? '2px solid var(--mica-accent)' : undefined,
                    outlineOffset: '2px',
                  }}
                  onClick={() => update({ backgroundTop: p.top, backgroundMid: p.mid, backgroundBottom: p.bottom })}
                />
              </Tooltip>
            ))}
          </div>
          {colorField('Top color', 'backgroundTop')}
          {colorField('Middle color', 'backgroundMid')}
          {colorField('Bottom color', 'backgroundBottom')}
          <div className={styles.fieldRow}>
            <Label size="small">Angle: {cardBack.gradientAngle}°</Label>
            <Slider
              min={0}
              max={360}
              step={1}
              value={cardBack.gradientAngle}
              onChange={(_, d) => update({ gradientAngle: d.value })}
            />
          </div>
        </div>

        <div className={styles.section}>
          <Text size={400} weight="semibold">Border</Text>
          {colorField('Color', 'borderColor')}
          <div className={styles.fieldRow}>
            <Label size="small">Width: {cardBack.borderWidth}px</Label>
            <Slider min={0} max={8} step={1} value={cardBack.borderWidth} onChange={(_, d) => update({ borderWidth: d.value })} />
          </div>
          <div className={styles.fieldRow}>
            <Label size="small">Radius: {cardBack.borderRadius}px</Label>
            <Slider min={0} max={20} step={1} value={cardBack.borderRadius} onChange={(_, d) => update({ borderRadius: d.value })} />
          </div>
        </div>

        <div className={styles.section}>
          <Text size={400} weight="semibold">Shadow</Text>
          {colorField('Color', 'shadowColor')}
          <div className={styles.fieldRow}>
            <Label size="small">Size: {cardBack.shadowSize}px</Label>
            <Slider min={0} max={30} step={1} value={cardBack.shadowSize} onChange={(_, d) => update({ shadowSize: d.value })} />
          </div>
        </div>

        <div className={styles.section}>
          <Text size={400} weight="semibold">Main Symbol</Text>
          <div className={styles.fieldRow}>
            <Label size="small">Preset icon</Label>
            <div className={styles.iconGrid}>
              {symbolPresets.map((p) => (
                <button
                  key={p.value}
                  className={styles.iconBtn}
                  style={selectedPreset?.value === p.value ? { borderColor: tokens.colorBrandStroke1, background: tokens.colorBrandBackground2 } : undefined}
                  onClick={() => update({ symbolSet: p.value, symbol: p.char })}
                  title={p.label}
                >
                  {p.char || '×'}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.fieldRow}>
            <Label size="small">Custom character</Label>
            <Input size="small" value={cardBack.symbol} onChange={(_, d) => update({ symbol: d.value })} maxLength={4} style={{ width: 100 }} />
          </div>
          <div className={styles.fieldRow}>
            <Label size="small">Size: {cardBack.symbolSize}px</Label>
            <Slider min={12} max={72} step={1} value={cardBack.symbolSize} onChange={(_, d) => update({ symbolSize: d.value })} />
          </div>
          {colorField('Color', 'symbolColor')}
        </div>

        <div className={styles.section}>
          <Text size={400} weight="semibold">Secondary Symbol</Text>
          <div className={styles.fieldRow}>
            <Label size="small">Character (empty = disabled)</Label>
            <Input size="small" value={cardBack.symbol2} onChange={(_, d) => update({ symbol2: d.value })} maxLength={4} style={{ width: 100 }} />
          </div>
          {cardBack.symbol2 && (
            <>
              <div className={styles.fieldRow}>
                <Label size="small">Size: {cardBack.symbol2Size}px</Label>
                <Slider min={8} max={48} step={1} value={cardBack.symbol2Size} onChange={(_, d) => update({ symbol2Size: d.value })} />
              </div>
              {colorField('Color', 'symbol2Color')}
            </>
          )}
        </div>

        <div className={styles.section}>
          <Text size={400} weight="semibold">Pattern</Text>
          <div className={styles.fieldRow}>
            <Label size="small">Type</Label>
            <Dropdown
              value={patternOptions.find(o => o.value === cardBack.pattern)?.label ?? 'None'}
              selectedOptions={[cardBack.pattern]}
              onOptionSelect={(_, d) => update({ pattern: d.optionValue as CardBackDesign['pattern'] ?? 'none' })}
            >
              {patternOptions.map(o => (
                <Option key={o.value} value={o.value}>{o.label}</Option>
              ))}
            </Dropdown>
          </div>
          {colorField('Pattern color', 'patternColor')}
          <div className={styles.fieldRow}>
            <Label size="small">Opacity: {Math.round(cardBack.patternOpacity * 100)}%</Label>
            <Slider min={0} max={100} step={1} value={Math.round(cardBack.patternOpacity * 100)} onChange={(_, d) => update({ patternOpacity: d.value / 100 })} />
          </div>
        </div>

        <div className={styles.section}>
          <Text size={400} weight="semibold">Texture</Text>
          <div className={styles.fieldRow}>
            <Label size="small">Image URL (asset path or URL)</Label>
            <Input size="small" value={cardBack.textureUrl} onChange={(_, d) => update({ textureUrl: d.value })} placeholder="assets/texture.png" />
          </div>
          {cardBack.textureUrl && (
            <div className={styles.fieldRow}>
              <Label size="small">Opacity: {Math.round(cardBack.textureOpacity * 100)}%</Label>
              <Slider min={0} max={100} step={1} value={Math.round(cardBack.textureOpacity * 100)} onChange={(_, d) => update({ textureOpacity: d.value / 100 })} />
            </div>
          )}
        </div>

        <div className={styles.toolbar} style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Tooltip content="Undo (Ctrl+Z)" relationship="label">
              <Button icon={<ArrowUndoRegular />} size="small" appearance="subtle" onClick={undoCardBack} disabled={pastCardBacks.length === 0} />
            </Tooltip>
            <Tooltip content="Redo (Ctrl+Y)" relationship="label">
              <Button icon={<ArrowRedoRegular />} size="small" appearance="subtle" onClick={redoCardBack} disabled={futureCardBacks.length === 0} />
            </Tooltip>
          </div>
          <Button icon={<SaveRegular />} appearance="primary" onClick={saveCardBack} disabled={!isDirty}>
            Save Card Back
          </Button>
        </div>
      </div>

      <div className={styles.previewPanel}>
        <Text size={400} weight="semibold">Preview</Text>
        <div
          className={styles.previewCard}
          style={{
            borderRadius: cardBack.borderRadius,
            background: `linear-gradient(${cardBack.gradientAngle}deg, ${cardBack.backgroundTop} 0%, ${cardBack.backgroundMid} 50%, ${cardBack.backgroundBottom} 100%)`,
            border: `${cardBack.borderWidth}px solid ${cardBack.borderColor}`,
            boxShadow: `${cardBack.shadowColor} 0 ${cardBack.shadowSize}px ${cardBack.shadowSize * 2}px`,
          }}
        >
          {cardBack.textureUrl && (
            <div
              style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${cardBack.textureUrl})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: cardBack.textureOpacity,
              }}
            />
          )}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: patternCss,
              opacity: cardBack.pattern === 'none' ? 0 : 1,
            }}
          />
          {cardBack.symbol2 && (
            <div
              style={{
                position: 'absolute', top: '12%', right: '12%',
                fontSize: cardBack.symbol2Size, color: cardBack.symbol2Color,
                fontWeight: 700, fontFamily: 'serif', zIndex: 2,
              }}
            >
              {cardBack.symbol2}
            </div>
          )}
          <div
            style={{
              width: '70%',
              height: '70%',
              borderRadius: '50%',
              border: `${cardBack.borderWidth}px solid ${cardBack.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `radial-gradient(circle at center, ${cardBack.backgroundMid}66 0%, transparent 70%)`,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <span
              style={{
                fontSize: cardBack.symbolSize,
                fontWeight: 700,
                color: cardBack.symbolColor,
                fontFamily: 'serif',
                textShadow: `0 0 20px ${cardBack.backgroundBottom}80`,
              }}
            >
              {cardBack.symbol || '?'}
            </span>
          </div>
        </div>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Preview updates in real-time
        </Text>
      </div>
    </div>
  );
}
