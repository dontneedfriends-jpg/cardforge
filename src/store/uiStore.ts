import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface UiStoreState {
  sidebarTab: string;
  theme: Theme;
}

interface UiStoreActions {
  setSidebarTab: (tab: string) => void;
  setTheme: (theme: Theme) => void;
}

type UiStore = UiStoreState & UiStoreActions;

export const useUiStore = create<UiStore>()((set) => ({
  sidebarTab: 'decks',
  theme: 'system',

  setSidebarTab: (tab: string) => set({ sidebarTab: tab }),
  setTheme: (theme: Theme) => set({ theme }),
}));
