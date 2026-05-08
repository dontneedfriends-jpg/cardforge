import type { EditorMode, CardBackDesign } from '../shared/types/project';
import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { elementsToTemplate, parseTemplateToElements } from '../features/template-editor/wysiwyg/sync';
import type { CardSize } from '../shared/types/project';
import { useCanvasStore } from './canvasStore';

interface EditorStoreState {
  html: string;
  css: string;
  isDirty: boolean;
  activeTab: 'html' | 'css';
  editorMode: EditorMode;
  currentDeckPath: string | null;
  currentCardSize: CardSize | null;
  cardBack: CardBackDesign;
  // Защита от циклической синхронизации:
  // 'visual' — html/css только что обновлены из canvas, CodeEditor не должен перепарсить обратно
  // 'code'   — elements только что обновлены из кода, Canvas не должен перегенерировать html/css
  // null     — нет активной синхронизации
  syncSource: 'visual' | 'code' | null;
}

interface EditorStoreActions {
  setHtml: (val: string) => void;
  setCss: (val: string) => void;
  setActiveTab: (tab: 'html' | 'css') => void;
  setEditorMode: (mode: EditorMode) => void;
  setCardBack: (design: CardBackDesign) => void;
  syncVisualToCode: (cardSize: CardSize) => void;
  syncCodeToVisual: () => void;
  clearSyncSource: () => void;
  saveTemplate: () => Promise<void>;
  saveCardBack: () => Promise<void>;
  loadTemplate: (deckPath: string) => Promise<void>;
  loadCardBack: (deckPath: string) => Promise<void>;
}

type EditorStore = EditorStoreState & EditorStoreActions;

const defaultCardBack: CardBackDesign = {
  backgroundTop: '#1a0a2e',
  backgroundBottom: '#2a1a4e',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 2,
  symbol: '?',
  symbolSize: 36,
  symbolColor: 'rgba(255,255,255,0.6)',
  pattern: 'stripes',
  patternColor: 'rgba(255,255,255,0.02)',
  patternOpacity: 1,
};

export const useEditorStore = create<EditorStore>()((set, get) => ({
  html: '',
  css: '',
  isDirty: false,
  activeTab: 'html',
  editorMode: 'code',
  currentDeckPath: null,
  currentCardSize: null,
  cardBack: { ...defaultCardBack },
  syncSource: null,

  setHtml: (val: string) => set({ html: val, isDirty: true }),
  setCss: (val: string) => set({ css: val, isDirty: true }),
  setActiveTab: (tab: 'html' | 'css') => set({ activeTab: tab }),
  setEditorMode: (mode: EditorMode) => set({ editorMode: mode }),
  setCardBack: (design: CardBackDesign) => set({ cardBack: design, isDirty: true }),
  clearSyncSource: () => set({ syncSource: null }),

  syncVisualToCode: (cardSize: CardSize) => {
    // Если сейчас идёт синхронизация code→visual — не реагируем, иначе цикл
    if (get().syncSource === 'code') return;

    const elements = useCanvasStore.getState().elements;
    const { html, css } = elementsToTemplate(elements, cardSize);
    // Помечаем источник ПЕРЕД записью, чтобы CodeEditor не перепарсил обратно
    set({ syncSource: 'visual', html, css, isDirty: true });
    // Сбрасываем флаг в следующем микротаске — после того как все подписчики получат обновление
    Promise.resolve().then(() => set({ syncSource: null }));
  },

  syncCodeToVisual: () => {
    // Если сейчас идёт синхронизация visual→code — не реагируем, иначе цикл
    if (get().syncSource === 'visual') return;

    const { html, css } = get();
    set({ syncSource: 'code' });

    if (!html.trim()) {
      useCanvasStore.getState().clearCanvas();
    } else {
      const elements = parseTemplateToElements(html, css);
      if (elements) {
        useCanvasStore.getState().setElements(elements);
      }
    }

    Promise.resolve().then(() => set({ syncSource: null }));
  },

  saveTemplate: async () => {
    const { currentDeckPath, html, css } = get();
    if (!currentDeckPath) return;
    await invoke('write_template', { deckPath: currentDeckPath, html, css });
    set({ isDirty: false });
  },

  saveCardBack: async () => {
    const { currentDeckPath, cardBack } = get();
    if (!currentDeckPath) return;
    await invoke('write_card_back', { deckPath: currentDeckPath, design: cardBack });
    set({ isDirty: false });
  },

  loadTemplate: async (deckPath: string) => {
    const files = await invoke<{ html: string; css: string }>('read_template', { deckPath });
    set({ html: files.html, css: files.css, isDirty: false, currentDeckPath: deckPath, currentCardSize: null });
  },

  loadCardBack: async (deckPath: string) => {
    const design = await invoke<CardBackDesign>('read_card_back', { deckPath });
    set({ cardBack: design });
  },
}));
