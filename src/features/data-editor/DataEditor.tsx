import { Text, makeStyles, Input, Button, Dropdown, Option, SpinButton, Checkbox, Textarea, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, Dialog, DialogTrigger, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, Field, Select, Tooltip } from '@fluentui/react-components';
import { AddRegular, DeleteRegular, DocumentHeaderArrowDownRegular, ColumnTripleRegular, ArrowUndoRegular } from '@fluentui/react-icons';
import type { SpinButtonOnChangeData } from '@fluentui/react-components';
import { useDeckStore } from '../../store';
import type { CellValue, Column, ColumnType } from '../../shared/types/project';
import { useState, useCallback, useRef, useEffect, memo } from 'react';

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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  saveStatus: {
    fontSize: '11px',
    color: 'var(--mica-text-tertiary)',
    fontFamily: 'monospace',
  },
  tableWrap: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
    background: 'var(--mica-base)',
  },
  table: {
    width: 'fit-content',
    minWidth: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  th: {
    padding: '8px 12px',
    textAlign: 'left',
    background: 'var(--mica-layer-2)',
    borderBottom: '1px solid var(--mica-stroke)',
    fontWeight: 600,
    fontSize: '12px',
    color: 'var(--mica-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  thContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  colTypeIcon: {
    opacity: 0.5,
    fontSize: '10px',
  },
  td: {
    padding: '6px 12px',
    borderBottom: '1px solid var(--mica-stroke-subtle)',
    transition: 'background 0.1s ease',
    ':hover': {
      background: 'var(--mica-layer-1)',
    },
  },
  tdFocused: {
    padding: '6px 12px',
    borderBottom: '1px solid var(--mica-stroke-subtle)',
    boxShadow: 'inset 0 0 0 2px var(--mica-accent)',
    background: 'var(--mica-layer-1)',
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
  rowNum: {
    color: 'var(--mica-text-tertiary)',
    fontSize: '11px',
    fontFamily: 'monospace',
    textAlign: 'right' as const,
    paddingRight: '8px',
    whiteSpace: 'nowrap',
    width: '40px',
    minWidth: '40px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  columnRenameInput: {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--mica-accent)',
    color: 'inherit',
    font: 'inherit',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    outline: 'none',
    width: '120px',
    padding: '2px 4px',
  },
  typeBadge: {
    fontSize: '10px',
    padding: '1px 6px',
    borderRadius: '4px',
    background: 'var(--mica-layer-3)',
    color: 'var(--mica-text-tertiary)',
    marginLeft: '6px',
    fontFamily: 'monospace',
  },
});

const TYPE_ICONS: Record<ColumnType, string> = {
  text: 'Aa',
  number: '#',
  boolean: '✓',
  color: '🎨',
  image: '🖼',
  enum: '☰',
  markdown: 'Md',
};

const COLUMN_TYPES: { value: ColumnType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'color', label: 'Color' },
  { value: 'image', label: 'Image' },
  { value: 'enum', label: 'Enum' },
  { value: 'markdown', label: 'Markdown' },
];

const CellInput = memo(function CellInput({ col, value, onChange }: { col: Column; value: CellValue; onChange: (v: CellValue) => void }) {
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
});

function AddColumnDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addColumn = useDeckStore((s) => s.addColumn);
  const [name, setName] = useState('');
  const [type, setType] = useState<ColumnType>('text');

  const handleAdd = useCallback(() => {
    if (!name.trim()) return;
    addColumn({ id: name.trim(), name: name.trim(), type });
    setName('');
    setType('text');
    onClose();
  }, [name, type, addColumn, onClose]);

  return (
    <Dialog open={open} onOpenChange={(_e, data) => { if (!data.open) onClose(); }}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Add Column</DialogTitle>
          <DialogContent>
            <Field label="Column Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. power, cost, description"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
            </Field>
            <Field label="Type" style={{ marginTop: 12 }}>
              <Select value={type} onChange={(e) => setType(e.target.value as ColumnType)}>
                {COLUMN_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </Select>
            </Field>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={handleAdd}>Add</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

export function DataEditor() {
  const styles = useStyles();
  const deckData = useDeckStore((s) => s.deckData);
  const saveStatus = useDeckStore((s) => s.saveStatus);
  const addRow = useDeckStore((s) => s.addRow);
  const deleteRow = useDeckStore((s) => s.deleteRow);
  const updateCell = useDeckStore((s) => s.updateCell);
  const deleteColumn = useDeckStore((s) => s.deleteColumn);
  const renameColumn = useDeckStore((s) => s.renameColumn);
  const updateColumnType = useDeckStore((s) => s.updateColumnType);

  const [addColOpen, setAddColOpen] = useState(false);
  const [renamingCol, setRenamingCol] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [focusedCell, setFocusedCell] = useState<{ row: number; col: string } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    if (renamingCol && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingCol]);

  const handleStartRename = (colName: string) => {
    setRenamingCol(colName);
    setRenameValue(colName);
  };

  const handleCommitRename = () => {
    if (renamingCol && renameValue.trim() && renameValue.trim() !== renamingCol) {
      renameColumn(renamingCol, renameValue.trim());
    }
    setRenamingCol(null);
  };

  const handleDeleteColumn = (colId: string) => {
    const colName = deckData?.columns.find(c => c.id === colId)?.name || colId;
    setConfirmState({
      message: `Delete column "${colName}"? All data in this column will be lost.`,
      onConfirm: () => { deleteColumn(colId); setConfirmState(null); },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, col: Column) => {
    if (!deckData) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const colIdx = deckData.columns.findIndex((c) => c.id === col.id);
      const nextCol = e.shiftKey
        ? deckData.columns[colIdx - 1]
        : deckData.columns[colIdx + 1];
      if (nextCol) {
        setFocusedCell({ row: rowIdx, col: nextCol.name });
      } else if (!e.shiftKey && rowIdx < deckData.rows.length - 1) {
        setFocusedCell({ row: rowIdx + 1, col: deckData.columns[0].name });
      } else if (e.shiftKey && rowIdx > 0) {
        setFocusedCell({ row: rowIdx - 1, col: deckData.columns[deckData.columns.length - 1].name });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIdx < deckData.rows.length - 1) {
        setFocusedCell({ row: rowIdx + 1, col: col.name });
      }
    }
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
        <div className={styles.headerLeft}>
          <Text size={400} weight="semibold">{deckData.meta.name} — Data</Text>
          <span className={styles.saveStatus}>
            {saveStatus === 'saving' ? '⏳ Saving...' : saveStatus === 'dirty' ? '● Unsaved' : ''}
          </span>
          <span className={styles.saveStatus}>
            {deckData.rows.length} row{deckData.rows.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className={styles.headerActions}>
          <Button icon={<AddRegular />} size="small" onClick={addRow}>
            Add Row
          </Button>
          <Button icon={<ColumnTripleRegular />} size="small" onClick={() => setAddColOpen(true)}>
            Add Column
          </Button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table} ref={tableRef}>
          <thead>
            <tr>
              <th className={styles.th} style={{ width: 40, minWidth: 40, textAlign: 'right' }}>#</th>
              {deckData.columns.map((col: Column) => (
                <th key={col.id} className={styles.th}>
                  {renamingCol === col.name ? (
                    <input
                      ref={renameInputRef}
                      className={styles.columnRenameInput}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleCommitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommitRename();
                        if (e.key === 'Escape') setRenamingCol(null);
                      }}
                    />
                  ) : (
                    <Menu openOnContext>
                      <MenuTrigger disableButtonEnhancement>
                        <div className={styles.thContent}>
                          <span>{col.name}</span>
                          <span className={styles.typeBadge}>{TYPE_ICONS[col.type] || 'Aa'}</span>
                        </div>
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuList>
                          <MenuItem onClick={() => handleStartRename(col.name)}>
                            <ArrowUndoRegular /> Rename
                          </MenuItem>
                          <MenuItem onClick={() => {
                            const types: ColumnType[] = ['text', 'number', 'boolean', 'color', 'image', 'enum', 'markdown'];
                            const idx = types.indexOf(col.type);
                            const next = types[(idx + 1) % types.length];
                            updateColumnType(col.id, next);
                          }}>
                            <DocumentHeaderArrowDownRegular /> Change Type (cycle)
                          </MenuItem>
                          <MenuItem onClick={() => handleDeleteColumn(col.id)}>
                            <DeleteRegular /> Delete
                          </MenuItem>
                        </MenuList>
                      </MenuPopover>
                    </Menu>
                  )}
                </th>
              ))}
              <th className={styles.th} style={{ width: 40, minWidth: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {deckData.rows.map((row: Record<string, CellValue>, rowIdx: number) => (
              <tr key={rowIdx}>
                <td className={styles.td}>
                  <div className={styles.rowNum}>{rowIdx + 1}</div>
                </td>
                {deckData.columns.map((col: Column) => {
                  const isFocused = focusedCell?.row === rowIdx && focusedCell?.col === col.name;
                  return (
                    <td key={col.id} className={isFocused ? styles.tdFocused : styles.td} onClick={() => setFocusedCell({ row: rowIdx, col: col.name })}>
                      <div onKeyDown={(e) => handleKeyDown(e, rowIdx, col)}>
                        <CellInput
                          col={col}
                          value={row[col.name]}
                          onChange={(v) => updateCell(rowIdx, col.name, v)}

                        />
                      </div>
                    </td>
                  );
                })}
                <td className={styles.td}>
                  <Tooltip content="Delete row" relationship="label">
                    <Button icon={<DeleteRegular />} size="small" appearance="subtle" onClick={() => {
                      setConfirmState({
                        message: 'Delete this row?',
                        onConfirm: () => { deleteRow(rowIdx); setConfirmState(null); },
                      });
                    }} />
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddColumnDialog open={addColOpen} onClose={() => setAddColOpen(false)} />

      <Dialog open={confirmState !== null} onOpenChange={(_e, data) => { if (!data.open) setConfirmState(null); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm</DialogTitle>
            <DialogContent>{confirmState?.message}</DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setConfirmState(null)}>Cancel</Button>
              <Button appearance="primary" onClick={() => confirmState?.onConfirm()}>Delete</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}