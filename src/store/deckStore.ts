import type { DeckData, DeckMeta, Column, CellValue, ColumnType } from '../shared/types/project';
import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useProjectStore } from './projectStore';

interface DeckStoreState {
  activeDeckId: string | null;
  deckData: DeckData | null;
  isDirty: boolean;
}

interface DeckStoreActions {
  setActiveDeck: (id: string) => Promise<void>;
  addRow: () => void;
  deleteRow: (index: number) => void;
  updateCell: (rowIndex: number, colId: string, value: CellValue) => void;
  addColumn: (col: Column) => void;
  deleteColumn: (colId: string) => void;
  saveData: () => Promise<void>;
  loadData: (deckPath: string, meta: DeckMeta) => Promise<void>;
}

type DeckStore = DeckStoreState & DeckStoreActions;

export const useDeckStore = create<DeckStore>()((set, get) => ({
  activeDeckId: null,
  deckData: null,
  isDirty: false,

  setActiveDeck: async (id: string) => {
    set({ activeDeckId: id });
  },

  loadData: async (deckPath: string, meta: DeckMeta) => {
    const rows = await invoke<Record<string, CellValue>[]>('read_csv', { path: `${deckPath}/cards.csv` });
    const columns: Column[] = rows.length > 0
      ? Object.keys(rows[0]).map(key => ({ id: key, name: key, type: 'text' as ColumnType }))
      : [];
    set({ deckData: { meta, columns, rows }, isDirty: false });
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
      };
    });
  },

  deleteRow: (index: number) => {
    set((state) => {
      if (!state.deckData) return state;
      const rows = state.deckData.rows.filter((_, i) => i !== index);
      return { deckData: { ...state.deckData, rows }, isDirty: true };
    });
  },

  updateCell: (rowIndex: number, colId: string, value: CellValue) => {
    set((state) => {
      if (!state.deckData) return state;
      const rows = state.deckData.rows.map((row, i) => {
        if (i !== rowIndex) return row;
        return { ...row, [colId]: value };
      });
      return { deckData: { ...state.deckData, rows }, isDirty: true };
    });
  },

  addColumn: (col: Column) => {
    set((state) => {
      if (!state.deckData) return state;
      const columns = [...state.deckData.columns, col];
      const rows = state.deckData.rows.map((row) => ({
        ...row,
        [col.name]: col.defaultValue ?? '',
      }));
      return { deckData: { ...state.deckData, columns, rows }, isDirty: true };
    });
  },

  deleteColumn: (colId: string) => {
    set((state) => {
      if (!state.deckData) return state;
      const columns = state.deckData.columns.filter((c) => c.id !== colId);
      const rows = state.deckData.rows.map((row) => {
        const col = state.deckData!.columns.find((c) => c.id === colId);
        if (!col) return row;
        const { [col.name]: _, ...rest } = row;
        return rest;
      });
      return { deckData: { ...state.deckData, columns, rows }, isDirty: true };
    });
  },

  saveData: async () => {
    const { deckData } = get();
    if (!deckData) return;
    const projectPath = useProjectStore.getState().projectPath;
    if (!projectPath) return;
    const rows = deckData.rows.map((row) => {
      const plain: Record<string, string> = {};
      deckData.columns.forEach((col) => {
        plain[col.name] = String(row[col.name] ?? '');
      });
      return plain;
    });
    const fullPath = `${projectPath}/${deckData.meta.path}`;
    await invoke('write_csv', { path: `${fullPath}/cards.csv`, rows });
    set({ isDirty: false });
  },
}));
