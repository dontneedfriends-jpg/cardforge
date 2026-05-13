import type { DeckData, DeckMeta, Column, CellValue, ColumnType } from '../shared/types/project';
import { invoke } from '@tauri-apps/api/core';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { create } from 'zustand';

interface DeckStoreState {
  activeDeckId: string | null;
  deckData: DeckData | null;
  currentDeckPath: string | null;
  isDirty: boolean;
  saveStatus: 'clean' | 'dirty' | 'saving';
}

interface DeckStoreActions {
  setActiveDeck: (id: string) => Promise<void>;
  _markDirty: () => void;
  addRow: () => void;
  deleteRow: (index: number) => void;
  updateCell: (rowIndex: number, colId: string, value: CellValue) => void;
  addColumn: (col: Column) => void;
  deleteColumn: (colId: string) => void;
  renameColumn: (oldName: string, newName: string) => void;
  updateColumnType: (colId: string, type: ColumnType) => void;
  reorderColumn: (colId: string, newIndex: number) => void;
  saveData: () => Promise<void>;
  loadData: (deckPath: string, meta: DeckMeta) => Promise<void>;
}

type DeckStore = DeckStoreState & DeckStoreActions;

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useDeckStore = create<DeckStore>()((set, get) => ({
  activeDeckId: null,
  deckData: null,
  currentDeckPath: null,
  isDirty: false,
  saveStatus: 'clean',

  setActiveDeck: async (id: string) => {
    set({ activeDeckId: id });
  },

  loadData: async (deckPath: string, meta: DeckMeta) => {
    try {
      const rows = await invoke<Record<string, CellValue>[]>('read_csv', { path: `${deckPath}/cards.csv` });
      let columns: Column[] = [];
      try {
        const colJson = await readTextFile(`${deckPath}/_columns.json`);
        columns = JSON.parse(colJson);
      } catch {
        columns = rows.length > 0
          ? Object.keys(rows[0]).map(key => ({ id: key, name: key, type: 'text' as ColumnType }))
          : [];
      }
      set({ deckData: { meta, columns, rows }, currentDeckPath: deckPath, isDirty: false, saveStatus: 'clean' });
    } catch {
      set({ deckData: { meta, columns: [], rows: [] }, currentDeckPath: deckPath, isDirty: false, saveStatus: 'clean' });
    }
  },

  _markDirty: () => {
    set({ isDirty: true, saveStatus: 'dirty' });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      get().saveData();
    }, 2000);
  },

  addRow: () => {
    set((state) => {
      if (!state.deckData) return state;
      const newRow: Record<string, CellValue> = {};
      state.deckData.columns.forEach((col) => {
        newRow[col.name] = col.defaultValue ?? '';
      });
      return {
        deckData: { ...state.deckData, rows: [...state.deckData.rows, newRow] },
        isDirty: true,
        saveStatus: 'dirty',
      };
    });
    get()._markDirty();
  },

  deleteRow: (index: number) => {
    set((state) => {
      if (!state.deckData) return state;
      const rows = state.deckData.rows.filter((_, i) => i !== index);
      return { deckData: { ...state.deckData, rows }, isDirty: true, saveStatus: 'dirty' };
    });
    get()._markDirty();
  },

  updateCell: (rowIndex: number, colId: string, value: CellValue) => {
    set((state) => {
      if (!state.deckData) return state;
      const rows = state.deckData.rows.map((row, i) => {
        if (i !== rowIndex) return row;
        return { ...row, [colId]: value };
      });
      return { deckData: { ...state.deckData, rows }, isDirty: true, saveStatus: 'dirty' };
    });
    get()._markDirty();
  },

  addColumn: (col: Column) => {
    set((state) => {
      if (!state.deckData) return state;
      const columns = [...state.deckData.columns, col];
      const rows = state.deckData.rows.map((row) => ({
        ...row,
        [col.name]: col.defaultValue ?? '',
      }));
      return { deckData: { ...state.deckData, columns, rows }, isDirty: true, saveStatus: 'dirty' };
    });
    get()._markDirty();
  },

  deleteColumn: (colId: string) => {
    set((state) => {
      if (!state.deckData) return state;
      const columns = state.deckData.columns.filter((c) => c.id !== colId);
      if (columns.length === state.deckData.columns.length) return state;
      const col = state.deckData.columns.find((c) => c.id === colId);
      if (!col) return state;
      const rows = state.deckData.rows.map((row) => {
        const { [col.name]: _, ...rest } = row;
        return rest;
      });
      return { deckData: { ...state.deckData, columns, rows }, isDirty: true, saveStatus: 'dirty' };
    });
    get()._markDirty();
  },

  renameColumn: (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    set((state) => {
      if (!state.deckData) return state;
      const columns = state.deckData.columns.map((c) =>
        c.name === oldName ? { ...c, id: newName, name: newName } : c
      );
      const rows = state.deckData.rows.map((row) => {
        if (!(oldName in row)) return row;
        const { [oldName]: val, ...rest } = row;
        return { ...rest, [newName]: val };
      });
      return { deckData: { ...state.deckData, columns, rows }, isDirty: true, saveStatus: 'dirty' };
    });
    get()._markDirty();
  },

  updateColumnType: (colId: string, type: ColumnType) => {
    set((state) => {
      if (!state.deckData) return state;
      const columns = state.deckData.columns.map((c) =>
        c.id === colId ? { ...c, type } : c
      );
      return { deckData: { ...state.deckData, columns }, isDirty: true, saveStatus: 'dirty' };
    });
    get()._markDirty();
  },

  reorderColumn: (colId: string, newIndex: number) => {
    set((state) => {
      if (!state.deckData) return state;
      const columns = [...state.deckData.columns];
      const oldIndex = columns.findIndex((c) => c.id === colId);
      if (oldIndex === -1) return state;
      const [col] = columns.splice(oldIndex, 1);
      columns.splice(newIndex, 0, col);
      return { deckData: { ...state.deckData, columns }, isDirty: true, saveStatus: 'dirty' };
    });
    get()._markDirty();
  },

  saveData: async () => {
    const { deckData, currentDeckPath, saveStatus } = get();
    if (!deckData || !currentDeckPath || saveStatus === 'saving') return;
    set({ saveStatus: 'saving' });
    try {
      const rows = deckData.rows.map((row) => {
        const plain: Record<string, string> = {};
        deckData.columns.forEach((col) => {
          plain[col.name] = String(row[col.name] ?? '');
        });
        return plain;
      });
      await Promise.all([
        invoke('write_csv', { path: `${currentDeckPath}/cards.csv`, rows }),
        writeTextFile(`${currentDeckPath}/_columns.json`, JSON.stringify(deckData.columns)),
      ]);
      set({ isDirty: false, saveStatus: 'clean' });
    } catch (e) {
      console.error('Failed to save data:', e);
      set({ saveStatus: 'dirty' });
    }
  },
}));
