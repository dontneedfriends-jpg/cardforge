import {
  Text, makeStyles, Input, Slider, Dropdown, Option, Button, Label, tokens
} from '@fluentui/react-components';
import { SaveRegular } from '@fluentui/react-icons';
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
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 0',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

const patternOptions = [
  { value: 'none', label: 'None' },
  { value: 'stripes', label: 'Stripes' },
  { value: 'dots', label: 'Dots' },
  { value: 'crosshatch', label: 'Crosshatch' },
];

function getPatternCss(pattern: string, color: string, opacity: number): string {
  const c = color.replace(/[\d.]+\)$/, `${opacity})`);
  switch (pattern) {
    case 'stripes':
      return `repeating-linear-gradient(45deg, transparent, transparent 10px, ${c} 10px, ${c} 11px)`;
    case 'dots':
      return `radial-gradient(${c} 1px, transparent 1px) 0 0 / 20px 20px`;
    case 'crosshatch':
      return [
        `repeating-linear-gradient(45deg, transparent, transparent 8px, ${c} 8px, ${c} 9px)`,
        `repeating-linear-gradient(-45deg, transparent, transparent 8px, ${c} 8px, ${c} 9px)`,
      ].join(', ');
    default:
      return 'none';
  }
}

export function CardBackEditor() {
  const styles = useStyles();
  const cardBack = useEditorStore((s) => s.cardBack);
  const setCardBack = useEditorStore((s) => s.setCardBack);
  const saveCardBack = useEditorStore((s) => s.saveCardBack);
  const isDirty = useEditorStore((s) => s.isDirty);

  const update = (partial: Partial<CardBackDesign>) => {
    setCardBack({ ...cardBack, ...partial });
  };

  const patternCss = getPatternCss(cardBack.pattern, cardBack.patternColor, cardBack.patternOpacity);

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <Text size={500} weight="semibold">Card Back Design</Text>

        <div className={styles.section}>
          <Text size={400} weight="semibold">Background</Text>
          <div className={styles.fieldRow}>
            <Label size="small">Top color</Label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={cardBack.backgroundTop}
                onChange={(e) => update({ backgroundTop: e.target.value })}
                style={{ width: 40, height: 32, padding: 0, border: 'none', cursor: 'pointer' }}
              />
              <Input
                size="small"
                value={cardBack.backgroundTop}
                onChange={(_, d) => update({ backgroundTop: d.value })}
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <Label size="small">Bottom color</Label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={cardBack.backgroundBottom}
                onChange={(e) => update({ backgroundBottom: e.target.value })}
                style={{ width: 40, height: 32, padding: 0, border: 'none', cursor: 'pointer' }}
              />
              <Input
                size="small"
                value={cardBack.backgroundBottom}
                onChange={(_, d) => update({ backgroundBottom: d.value })}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <Text size={400} weight="semibold">Border</Text>
          <div className={styles.fieldRow}>
            <Label size="small">Color</Label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={cardBack.borderColor.startsWith('#') ? cardBack.borderColor : '#ffffff'}
                onChange={(e) => update({ borderColor: e.target.value })}
                style={{ width: 40, height: 32, padding: 0, border: 'none', cursor: 'pointer' }}
              />
              <Input
                size="small"
                value={cardBack.borderColor}
                onChange={(_, d) => update({ borderColor: d.value })}
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <Label size="small">Width (px)</Label>
            <Slider
              min={0}
              max={8}
              step={1}
              value={cardBack.borderWidth}
              onChange={(_, d) => update({ borderWidth: d.value })}
            />
          </div>
        </div>

        <div className={styles.section}>
          <Text size={400} weight="semibold">Symbol</Text>
          <div className={styles.fieldRow}>
            <Label size="small">Character</Label>
            <Input
              size="small"
              value={cardBack.symbol}
              onChange={(_, d) => update({ symbol: d.value })}
              maxLength={4}
              style={{ width: 100 }}
            />
          </div>
          <div className={styles.fieldRow}>
            <Label size="small">Size (px)</Label>
            <Slider
              min={12}
              max={72}
              step={1}
              value={cardBack.symbolSize}
              onChange={(_, d) => update({ symbolSize: d.value })}
            />
          </div>
          <div className={styles.fieldRow}>
            <Label size="small">Color</Label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={cardBack.symbolColor.startsWith('#') ? cardBack.symbolColor : '#ffffff'}
                onChange={(e) => update({ symbolColor: e.target.value })}
                style={{ width: 40, height: 32, padding: 0, border: 'none', cursor: 'pointer' }}
              />
              <Input
                size="small"
                value={cardBack.symbolColor}
                onChange={(_, d) => update({ symbolColor: d.value })}
                style={{ flex: 1 }}
              />
            </div>
          </div>
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
          <div className={styles.fieldRow}>
            <Label size="small">Pattern color</Label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={cardBack.patternColor.startsWith('#') ? cardBack.patternColor : '#ffffff'}
                onChange={(e) => update({ patternColor: e.target.value })}
                style={{ width: 40, height: 32, padding: 0, border: 'none', cursor: 'pointer' }}
              />
              <Input
                size="small"
                value={cardBack.patternColor}
                onChange={(_, d) => update({ patternColor: d.value })}
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <Label size="small">Opacity</Label>
            <Slider
              min={0}
              max={100}
              step={1}
              value={Math.round(cardBack.patternOpacity * 100)}
              onChange={(_, d) => update({ patternOpacity: d.value / 100 })}
            />
          </div>
        </div>

        <div className={styles.toolbar}>
          <Button
            icon={<SaveRegular />}
            appearance="primary"
            onClick={saveCardBack}
            disabled={!isDirty}
          >
            Save Card Back
          </Button>
        </div>
      </div>

      <div className={styles.previewPanel}>
        <Text size={400} weight="semibold">Preview</Text>
        <div
          className={styles.previewCard}
          style={{
            background: `linear-gradient(135deg, ${cardBack.backgroundTop} 0%, ${cardBack.backgroundBottom} 30%, ${cardBack.backgroundTop} 100%)`,
            border: `${cardBack.borderWidth}px solid ${cardBack.borderColor}`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: patternCss,
              opacity: cardBack.pattern === 'none' ? 0 : 1,
            }}
          />
          <div
            style={{
              width: '70%',
              height: '70%',
              borderRadius: '50%',
              border: `2px solid ${cardBack.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `radial-gradient(circle at center, ${cardBack.backgroundBottom}66 0%, transparent 70%)`,
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
                textShadow: cardBack.symbolColor === 'rgba(255,255,255,0.6)'
                  ? `0 0 20px ${cardBack.backgroundBottom}80`
                  : 'none',
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
