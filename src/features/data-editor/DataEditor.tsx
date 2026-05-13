import { Text, makeStyles, Input, Button, Checkbox, Dropdown, Option, SpinButton, Textarea } from '@fluentui/react-components';
import { AddRegular, DeleteRegular } from '@fluentui/react-icons';
import type { SpinButtonOnChangeData } from '@fluentui/react-components';
import { useDeckStore, useUiStore } from '../../store';
import type { CellValue, Column } from '../../shared/types/project';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    height: '48px',
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    background: 'var(--mica-layer-1)',
    borderBottom: '1px solid var(--mica-stroke)',
  },
  tableWrap: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
    background: 'var(--mica-base)',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    background: 'var(--mica-layer-2)',
    borderBottom: '1px solid var(--mica-stroke)',
    fontWeight: 600,
    fontSize: '12px',
    color: 'var(--mica-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid var(--mica-stroke-subtle)',
    transition: 'background 0.15s ease',
    ':hover': {
      background: 'var(--mica-layer-1)',
    },
  },
  input: {
    width: '100%',
    minWidth: '80px',
  },
  colorPicker: {
    width: '32px',
    height: '32px',
    padding: 0,
    border: 'none',
    cursor: 'pointer',
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  imageCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  imageThumb: {
    width: '40px',
    height: '40px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  markdownCell: {
    width: '100%',
    minWidth: '120px',
  },
});

function CellInput({ col, value, onChange }: { col: Column; value: CellValue; onChange: (v: CellValue) => void }) {
  const styles = useStyles();

  switch (col.type) {
    case 'boolean':
      return (
        <Checkbox
          checked={value === true || value === 'true'}
          onChange={(_e, data) => onChange(data.checked ?? false)}
        />
      );
    case 'number':
      return (
        <SpinButton
          size="small"
          value={typeof value === 'number' ? value : Number(value) || 0}
          min={-Infinity}
          onChange={(_e: unknown, data: SpinButtonOnChangeData) => {
            if (data.value !== undefined && data.value !== null) onChange(data.value);
          }}
          style={{ width: 120 }}
        />
      );
    case 'color':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="color"
            className={styles.colorPicker}
            value={typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
          />
          <Input
            size="small"
            appearance="underline"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: 80 }}
          />
        </div>
      );
    case 'enum':
      return (
        <Dropdown
          size="small"
          value={typeof value === 'string' ? value : ''}
          selectedOptions={typeof value === 'string' ? [value] : []}
          onOptionSelect={(_e: unknown, data: { optionValue?: string }) => {
            if (data.optionValue) onChange(data.optionValue);
          }}
          style={{ minWidth: 120 }}
        >
          {(col.enumValues || []).map((opt) => (
            <Option key={opt} value={opt}>{opt}</Option>
          ))}
        </Dropdown>
      );
    case 'image':
      return (
        <div className={styles.imageCell}>
          {typeof value === 'string' && value && (
            <img
              src={value || ''}
              alt=""
              className={styles.imageThumb}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <Input
            className={styles.input}
            size="small"
            appearance="underline"
            value={String(value ?? '')}
            placeholder="assets/image.png"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case 'markdown':
      return (
        <Textarea
          className={styles.markdownCell}
          size="small"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
        />
      );
    default:
      return (
        <Input
          className={styles.input}
          size="small"
          appearance="underline"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export function DataEditor() {
  const styles = useStyles();
  const deckData = useDeckStore((s) => s.deckData);
  const addRow = useDeckStore((s) => s.addRow);
  const deleteRow = useDeckStore((s) => s.deleteRow);
  const updateCell = useDeckStore((s) => s.updateCell);
  const confirmDelete = useUiStore((s) => s.confirmDelete);

  const handleDeleteRow = (rowIdx: number) => {
    if (confirmDelete && !confirm('Delete this row?')) return;
    deleteRow(rowIdx);
  };

  if (!deckData) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Text size={400} weight="semibold">Data Editor</Text>
        </div>
        <div style={{ padding: 24 }}>
          <Text size={300}>Select a deck to edit data</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={400} weight="semibold">{deckData.meta.name} — Data</Text>
        <Button icon={<AddRegular />} size="small" onClick={addRow}>
          Add Row
        </Button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} style={{ width: 40 }}>#</th>
              {deckData.columns.map((col: Column) => (
                <th key={col.id} className={styles.th}>{col.name}</th>
              ))}
              <th className={styles.th} style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {deckData.rows.map((row: Record<string, CellValue>, rowIdx: number) => (
              <tr key={rowIdx}>
                <td className={styles.td}>{rowIdx + 1}</td>
                {deckData.columns.map((col: Column) => (
                  <td key={col.id} className={styles.td}>
                    <CellInput
                      col={col}
                      value={row[col.name]}
                      onChange={(v) => updateCell(rowIdx, col.name, v)}
                    />
                  </td>
                ))}
                <td className={styles.td}>
                  <Button icon={<DeleteRegular />} size="small" appearance="subtle" onClick={() => handleDeleteRow(rowIdx)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
