import { Text, makeStyles, RadioGroup, Radio, Label, Dropdown, Option } from '@fluentui/react-components';
import { useUiStore } from '../../store';
import { CARD_SIZE_PRESETS } from '../../shared/cardSizes';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
    padding: '32px 40px',
    gap: '32px',
    maxWidth: '600px',
    margin: '0 auto',
    width: '100%',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'rgba(255, 255, 255, 0.40)',
  },
});

export function SettingsPage() {
  const styles = useStyles();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  return (
    <div className={styles.container}>
      <Text size={600} weight="semibold">Settings</Text>

      <div className={styles.section}>
        <Label size="large">Theme</Label>
        <RadioGroup
          value={theme}
          onChange={(_e: unknown, data: any) => setTheme(data.value)}
        >
          <Radio value="light" label="Light" />
          <Radio value="dark" label="Dark" />
          <Radio value="system" label="System" />
        </RadioGroup>
      </div>

      <div className={styles.section}>
        <Label size="large">Default Card Size</Label>
        <Dropdown
          placeholder="Poker (63×88mm, 3mm bleed)"
          style={{ maxWidth: 350 }}
        >
          {CARD_SIZE_PRESETS.map(p => (
            <Option
              key={p.id}
              value={`${p.widthMm},${p.heightMm},${p.bleedMm}`}
              text={`${p.name} — ${p.widthMm}×${p.heightMm}mm`}
            >
              {p.name} — {p.widthMm}×{p.heightMm}mm, {p.bleedMm}mm bleed
              {p.note ? ` (${p.note})` : ''}
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.section}>
        <Label size="large">Export DPI</Label>
        <Dropdown
          placeholder="300"
          style={{ maxWidth: 250 }}
        >
          <Option value="150">150 (draft)</Option>
          <Option value="300">300 (standard)</Option>
          <Option value="600">600 (print quality)</Option>
        </Dropdown>
      </div>
    </div>
  );
}
