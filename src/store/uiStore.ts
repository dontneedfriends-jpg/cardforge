import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type Density = 'compact' | 'comfortable' | 'spacious';

interface UiStoreState {
  sidebarTab: string;
  theme: Theme;
  fontSize: FontSize;
  density: Density;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  autoSave: boolean;
  autoSaveInterval: number;
  confirmDelete: boolean;
  showTooltips: boolean;
  recentProjectsLimit: number;
  defaultExportDpi: number;
  defaultBleedMm: number;
  previewBackground: 'checkerboard' | 'dark' | 'light';
  language: string;
  defaultCardSizePreset: string;
}

interface UiStoreActions {
  setSidebarTab: (tab: string) => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setDensity: (density: Density) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  setAutoSave: (autoSave: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  setConfirmDelete: (confirm: boolean) => void;
  setShowTooltips: (show: boolean) => void;
  setRecentProjectsLimit: (limit: number) => void;
  setDefaultExportDpi: (dpi: number) => void;
  setDefaultBleedMm: (mm: number) => void;
  setPreviewBackground: (bg: 'checkerboard' | 'dark' | 'light') => void;
  setLanguage: (lang: string) => void;
  setDefaultCardSizePreset: (preset: string) => void;
  resetToDefaults: () => void;
}

type UiStore = UiStoreState & UiStoreActions;

const defaultState: UiStoreState = {
  sidebarTab: 'decks',
  theme: 'system',
  fontSize: 'medium',
  density: 'comfortable',
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,
  autoSave: true,
  autoSaveInterval: 30,
  confirmDelete: true,
  showTooltips: true,
  recentProjectsLimit: 10,
  defaultExportDpi: 300,
  defaultBleedMm: 3,
  previewBackground: 'checkerboard',
  language: 'en',
  defaultCardSizePreset: 'poker',
};

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      ...defaultState,

      setSidebarTab: (tab: string) => set({ sidebarTab: tab }),
      setTheme: (theme: Theme) => set({ theme }),
      setFontSize: (fontSize: FontSize) => set({ fontSize }),
      setDensity: (density: Density) => set({ density }),
      setShowGrid: (showGrid: boolean) => set({ showGrid }),
      setSnapToGrid: (snapToGrid: boolean) => set({ snapToGrid }),
      setGridSize: (gridSize: number) => set({ gridSize }),
      setAutoSave: (autoSave: boolean) => set({ autoSave }),
      setAutoSaveInterval: (autoSaveInterval: number) => set({ autoSaveInterval }),
      setConfirmDelete: (confirmDelete: boolean) => set({ confirmDelete }),
      setShowTooltips: (showTooltips: boolean) => set({ showTooltips }),
      setRecentProjectsLimit: (recentProjectsLimit: number) => set({ recentProjectsLimit }),
      setDefaultExportDpi: (defaultExportDpi: number) => set({ defaultExportDpi }),
      setDefaultBleedMm: (defaultBleedMm: number) => set({ defaultBleedMm }),
      setPreviewBackground: (previewBackground: 'checkerboard' | 'dark' | 'light') => set({ previewBackground }),
      setLanguage: (language: string) => set({ language }),
      setDefaultCardSizePreset: (defaultCardSizePreset: string) => set({ defaultCardSizePreset }),
      resetToDefaults: () => set(defaultState),
    }),
    {
      name: 'cardforge-ui-settings',
    }
  )
);
