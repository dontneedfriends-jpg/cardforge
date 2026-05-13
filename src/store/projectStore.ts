import type { CardForgeManifest, CardSize } from '../shared/types/project';
import { invoke } from '@tauri-apps/api/core';

interface ProjectStoreState {
  projectPath: string | null;
  manifest: CardForgeManifest | null;
  isDirty: boolean;
  recentProjects: { path: string; name: string }[];
}

interface ProjectStoreActions {
  openProject: (path: string) => Promise<void>;
  createProject: (path: string, name: string) => Promise<void>;
  saveManifest: () => Promise<void>;
  addDeck: (name: string, cardSize: CardSize) => Promise<void>;
  removeDeck: (deckId: string) => Promise<void>;
  renameDeck: (deckId: string, newName: string) => Promise<void>;
}

type ProjectStore = ProjectStoreState & ProjectStoreActions;

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

export const useProjectStore = create<ProjectStore>()(
  persist(
    immer((set, get) => ({
      projectPath: null,
      manifest: null,
      isDirty: false,
      recentProjects: [],

      openProject: async (path: string) => {
        const manifest = await invoke<CardForgeManifest>('open_project', { path });
        set((state) => {
          state.projectPath = path;
          state.manifest = manifest;
          state.isDirty = false;
          const existing = state.recentProjects.find((p) => p.path === path);
          if (!existing) {
            state.recentProjects.unshift({ path, name: manifest.name });
            if (state.recentProjects.length > 10) state.recentProjects.pop();
          }
        });
      },

      createProject: async (path: string, name: string) => {
        const manifest = await invoke<CardForgeManifest>('create_project', { path, name });
        set((state) => {
          state.projectPath = path;
          state.manifest = manifest;
          state.isDirty = false;
          state.recentProjects.unshift({ path, name });
          if (state.recentProjects.length > 10) state.recentProjects.pop();
        });
      },

    saveManifest: async () => {
      const { projectPath, manifest } = get();
      if (!projectPath || !manifest) return;
      await invoke('save_manifest', { path: projectPath, manifest });
      set((state) => { state.isDirty = false; });
    },

    addDeck: async (name: string, cardSize: CardSize) => {
      const pp = get().projectPath;
      set((state) => {
        if (!state.manifest) return;
        const id = `deck_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        const path = `decks/${name.toLowerCase().replace(/\s+/g, '_')}`;
        state.manifest.decks.push({ id, name, path, cardSize });
        state.isDirty = true;
      });
      const st = get();
      if (pp && st.manifest) {
        await invoke('save_manifest', { path: pp, manifest: st.manifest });
        set((s) => { s.isDirty = false; });
      }
    },

    removeDeck: async (deckId: string) => {
      const pp = get().projectPath;
      set((state) => {
        if (!state.manifest) return;
        state.manifest.decks = state.manifest.decks.filter((d) => d.id !== deckId);
        state.isDirty = true;
      });
      const st = get();
      if (pp && st.manifest) {
        await invoke('save_manifest', { path: pp, manifest: st.manifest });
        set((s) => { s.isDirty = false; });
      }
    },

    renameDeck: async (deckId: string, newName: string) => {
      const pp = get().projectPath;
      set((state) => {
        if (!state.manifest) return;
        const deck = state.manifest.decks.find((d) => d.id === deckId);
        if (deck) deck.name = newName;
        state.isDirty = true;
      });
      const st = get();
      if (pp && st.manifest) {
        await invoke('save_manifest', { path: pp, manifest: st.manifest });
        set((s) => { s.isDirty = false; });
      }
    },
  })),
  {
    name: 'cardforge-project',
    partialize: (state) => ({
      projectPath: state.projectPath,
      recentProjects: state.recentProjects,
    }),
  }
)
);
