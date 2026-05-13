import type { EditorMode, CardBackDesign, CardSize } from '../shared/types/project';
import type { CanvasElement } from './canvasStore';
import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useProjectStore } from './projectStore';
import { elementsToTemplate, parseTemplateToElements } from '../features/template-editor/wysiwyg/sync';
import { useCanvasStore } from './canvasStore';
import { DEFAULT_CARD_SIZE } from '../shared/cardSizes';
import { getPatternCss } from '../shared/utils/patternCss';

interface EditorStoreState {
  html: string;
  css: string;
  isDirty: boolean;
  activeTab: 'html' | 'css';
  editorMode: EditorMode;
  currentDeckPath: string | null;
  currentCardSize: CardSize | null;
  cardBack: CardBackDesign;
  pastCardBacks: CardBackDesign[];
  futureCardBacks: CardBackDesign[];
  cardBackHtml: string;
  cardBackCss: string;
  cardBackEditorMode: 'code' | 'visual';
  cardBackSyncSource: 'code' | 'visual' | null;
  syncSource: 'visual' | 'code' | null;
  previewCardIndex: number;
}

interface EditorStoreActions {
  setHtml: (val: string) => void;
  setCss: (val: string) => void;
  setActiveTab: (tab: 'html' | 'css') => void;
  setEditorMode: (mode: EditorMode) => void;
  setPreviewCardIndex: (idx: number) => void;
  setCardBack: (design: CardBackDesign) => void;
  undoCardBack: () => void;
  redoCardBack: () => void;
  setCardBackHtml: (val: string) => void;
  setCardBackCss: (val: string) => void;
  setCardBackEditorMode: (mode: 'code' | 'visual') => void;
  syncVisualToCode: () => void;
  syncCodeToVisual: () => boolean;
  clearSyncSource: () => void;
  saveTemplate: () => Promise<void>;
  saveCanvas: () => Promise<void>;
  loadCanvas: (deckPath: string) => Promise<boolean>;
  saveCardBack: () => Promise<void>;
  loadTemplate: (deckPath: string) => Promise<void>;
  loadCardBack: (deckPath: string) => Promise<void>;
  syncCardBackVisualToCode: () => void;
  syncCardBackCodeToVisual: () => boolean;
}

type EditorStore = EditorStoreState & EditorStoreActions;

const defaultCardBack: CardBackDesign = {
  backgroundTop: '#1a0a2e',
  backgroundMid: '#1f1240',
  backgroundBottom: '#2a1a4e',
  gradientAngle: 135,
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 2,
  borderRadius: 8,
  shadowColor: 'rgba(0,0,0,0.4)',
  shadowSize: 12,
  symbol: '?',
  symbolSet: 'none',
  symbolSize: 36,
  symbolColor: 'rgba(255,255,255,0.6)',
  symbol2: '',
  symbol2Size: 18,
  symbol2Color: 'rgba(255,255,255,0.3)',
  pattern: 'stripes',
  patternColor: 'rgba(255,255,255,0.02)',
  patternOpacity: 1,
  textureUrl: '',
  textureOpacity: 0.3,
};

function cardBackDesignToHtmlCss(d: CardBackDesign): { html: string; css: string } {
  const patternCss = getPatternCss(d.pattern, d.patternColor, d.patternOpacity);
  const html = `<div class="card-back">
  ${d.textureUrl ? `<div class="card-back-texture" style="background-image:url('${d.textureUrl}');opacity:${d.textureOpacity};"></div>` : ''}
  <div class="card-back-pattern"></div>
  ${d.symbol2 ? `<div class="card-back-symbol2">${d.symbol2}</div>` : ''}
  <div class="card-back-circle">
    <span class="card-back-symbol">${d.symbol || '?'}</span>
  </div>
</div>`;
  const css = `.card-back {
  width: 100%; height: 100%;
  background: linear-gradient(${d.gradientAngle}deg, ${d.backgroundTop} 0%, ${d.backgroundMid} 50%, ${d.backgroundBottom} 100%);
  border-radius: ${d.borderRadius}px;
  border: ${d.borderWidth}px solid ${d.borderColor};
  box-shadow: ${d.shadowColor} 0 ${d.shadowSize}px ${d.shadowSize * 2}px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
}
.card-back-texture {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
}
.card-back-pattern {
  position: absolute; inset: 0;
  background: ${patternCss};
  ${d.pattern === 'none' ? 'opacity: 0;' : ''}
}
.card-back-symbol2 {
  position: absolute;
  top: 12%; right: 12%;
  font-size: ${d.symbol2Size}px;
  color: ${d.symbol2Color};
  font-weight: 700; font-family: serif;
  z-index: 2;
}
.card-back-circle {
  width: 70%; height: 70%;
  border-radius: 50%;
  border: ${d.borderWidth}px solid ${d.borderColor};
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, ${d.backgroundMid}66 0%, transparent 70%);
  position: relative;
  z-index: 1;
}
.card-back-symbol {
  font-size: ${d.symbolSize}px;
  font-weight: 700;
  color: ${d.symbolColor};
  font-family: serif;
  text-shadow: 0 0 20px ${d.backgroundBottom}80;
}`;
  return { html, css };
}

function parseCssProp(css: string, prop: string): string | null {
  const re = new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i');
  const m = css.match(re);
  return m ? m[1].trim() : null;
}

function extractGradientColor(css: string, index: number): string | null {
  const m = css.match(/linear-gradient\([^)]+\)/);
  if (!m) return null;
  const stops = m[0].match(/#[a-fA-F0-9]{3,8}|rgba?\([^)]+\)/g);
  return stops && stops[index] ? stops[index] : null;
}

function extractAngle(css: string): number {
  const m = css.match(/linear-gradient\((\d+)deg/);
  return m ? parseInt(m[1]) : 135;
}

function parseCardBackHtmlCss(html: string, css: string): CardBackDesign {
  const d: CardBackDesign = {
    backgroundTop: extractGradientColor(css, 0) || '#1a0a2e',
    backgroundMid: extractGradientColor(css, 1) || '#1f1240',
    backgroundBottom: extractGradientColor(css, 2) || '#2a1a4e',
    gradientAngle: extractAngle(css),
    borderColor: parseCssProp(css, 'border-color') || 'rgba(255,255,255,0.1)',
    borderWidth: parseFloat(parseCssProp(css, 'border-width') || '2'),
    borderRadius: parseFloat(parseCssProp(css, 'border-radius') || '8'),
    shadowColor: parseCssProp(css, 'box-shadow')?.replace(/\s+\d+px\s+\d+px\s+\d+px$/, '') || 'rgba(0,0,0,0.4)',
    shadowSize: (() => {
      const s = parseCssProp(css, 'box-shadow')?.match(/\s+(\d+)px\s+(\d+)px/);
      return s ? parseInt(s[2]) : 12;
    })(),
    symbol: (() => {
      const m = html.match(/class="card-back-symbol"[^>]*>([^<]+)</);
      return m ? m[1].trim() : '?';
    })(),
    symbolSet: 'none',
    symbolSize: (() => {
      const m = css.match(/\.card-back-symbol\s*\{[^}]*font-size:\s*(\d+)px/i);
      return m ? parseInt(m[1]) : 36;
    })(),
    symbolColor: (() => {
      const m = css.match(/\.card-back-symbol\s*\{[^}]*color:\s*([^;\n]+)/i);
      return m ? m[1].trim() : 'rgba(255,255,255,0.6)';
    })(),
    symbol2: (() => {
      const m = html.match(/class="card-back-symbol2"[^>]*>([^<]+)</);
      return m ? m[1].trim() : '';
    })(),
    symbol2Size: (() => {
      const m = css.match(/\.card-back-symbol2\s*\{[^}]*font-size:\s*(\d+)px/i);
      return m ? parseInt(m[1]) : 18;
    })(),
    symbol2Color: (() => {
      const m = css.match(/\.card-back-symbol2\s*\{[^}]*color:\s*([^;\n]+)/i);
      return m ? m[1].trim() : 'rgba(255,255,255,0.3)';
    })(),
    pattern: (() => {
      const bg = parseCssProp(css, 'background') || '';
      if (bg.includes('crosshatch')) return 'crosshatch';
      if (bg.includes('dots')) return 'dots';
      if (bg.includes('stripes')) return 'stripes';
      return 'none';
    })(),
    patternColor: 'rgba(255,255,255,0.02)',
    patternOpacity: 1,
    textureUrl: (() => {
      const m = html.match(/background-image:\s*url\('([^']+)'\)/);
      return m ? m[1] : '';
    })(),
    textureOpacity: (() => {
      const m = html.match(/opacity:([\d.]+)/);
      return m ? parseFloat(m[1]) : 0.3;
    })(),
  };
  return d;
}

const MAX_CARD_BACK_HISTORY = 50;

export const useEditorStore = create<EditorStore>()((set, get) => ({
  html: '',
  css: '',
  isDirty: false,
  activeTab: 'html',
  editorMode: 'code',
  currentDeckPath: null,
  currentCardSize: null,
  cardBack: { ...defaultCardBack },
  pastCardBacks: [],
  futureCardBacks: [],
  cardBackHtml: '',
  cardBackCss: '',
  cardBackEditorMode: 'visual',
  cardBackSyncSource: null,
  syncSource: null,
  previewCardIndex: 0,

  setHtml: (val: string) => set({ html: val, isDirty: true }),
  setCss: (val: string) => set({ css: val, isDirty: true }),
  setActiveTab: (tab: 'html' | 'css') => set({ activeTab: tab }),
  setEditorMode: (mode: EditorMode) => set({ editorMode: mode }),
  setPreviewCardIndex: (idx: number) => set({ previewCardIndex: idx }),
  setCardBack: (design: CardBackDesign) => {
    const prev = get().cardBack;
    if (prev === design) return;
    const { html, css } = cardBackDesignToHtmlCss(design);
    set({
      pastCardBacks: [...get().pastCardBacks.slice(-(MAX_CARD_BACK_HISTORY - 1)), { ...prev }],
      futureCardBacks: [],
      cardBack: design,
      cardBackHtml: html,
      cardBackCss: css,
      isDirty: true,
    });
  },

  undoCardBack: () => {
    const { pastCardBacks, cardBack } = get();
    if (pastCardBacks.length === 0) return;
    const prev = pastCardBacks[pastCardBacks.length - 1];
    const { html, css } = cardBackDesignToHtmlCss(prev);
    set({
      pastCardBacks: pastCardBacks.slice(0, -1),
      futureCardBacks: [...get().futureCardBacks, { ...cardBack }],
      cardBack: prev,
      cardBackHtml: html,
      cardBackCss: css,
      isDirty: true,
    });
  },

  redoCardBack: () => {
    const { futureCardBacks, cardBack } = get();
    if (futureCardBacks.length === 0) return;
    const next = futureCardBacks[futureCardBacks.length - 1];
    const { html, css } = cardBackDesignToHtmlCss(next);
    set({
      futureCardBacks: futureCardBacks.slice(0, -1),
      pastCardBacks: [...get().pastCardBacks, { ...cardBack }],
      cardBack: next,
      cardBackHtml: html,
      cardBackCss: css,
      isDirty: true,
    });
  },

  setCardBackHtml: (val: string) => set({ cardBackHtml: val, isDirty: true }),
  setCardBackCss: (val: string) => set({ cardBackCss: val, isDirty: true }),
  setCardBackEditorMode: (mode: 'code' | 'visual') => set({ cardBackEditorMode: mode }),
  clearSyncSource: () => set({ syncSource: null }),

  syncVisualToCode: () => {
    // Если сейчас идёт синхронизация code→visual — не реагируем, иначе цикл
    if (get().syncSource === 'code') return;

    const elements = useCanvasStore.getState().elements;
    
    // Если canvas пустой — не перезаписываем HTML (сохраняем оригинал)
    if (elements.length === 0) {
      console.warn('[Sync] Canvas is empty, skipping HTML generation to preserve original template.');
      return;
    }
    
    const { css: existingCss, currentCardSize } = get();
    const cardSize = currentCardSize || DEFAULT_CARD_SIZE;
    const { html, css } = elementsToTemplate(elements, cardSize, existingCss);
    // Помечаем источник ПЕРЕД записью, чтобы CodeEditor не перепарсил обратно
    set({ syncSource: 'visual', html, css, isDirty: true });
    // Сбрасываем флаг в следующем микротаске — после того как все подписчики получат обновление
    Promise.resolve().then(() => set({ syncSource: null }));
  },

  syncCodeToVisual: () => {
    if (get().syncSource === 'visual') {
      return false;
    }

    const { html, css, currentCardSize } = get();
    set({ syncSource: 'code' });

    let success = false;

    if (!html.trim()) {
      useCanvasStore.getState().clearCanvas();
      success = true;
    } else {
      const cardSize = currentCardSize || DEFAULT_CARD_SIZE;
      const elements = parseTemplateToElements(html, css, cardSize);
      if (elements) {
        useCanvasStore.getState().setElements(elements);
        success = true;
      } else {
        console.warn('[Sync] Could not parse template to visual elements. Staying in code mode.');
      }
    }

    Promise.resolve().then(() => set({ syncSource: null }));
    return success;
  },

  saveTemplate: async () => {
    const { currentDeckPath, html, css, editorMode } = get();
    if (!currentDeckPath) return;
    await invoke('write_template', { deckPath: currentDeckPath, html, css });
    if (editorMode === 'visual') {
      await get().saveCanvas();
    }
    set({ isDirty: false });
  },

  saveCanvas: async () => {
    const { currentDeckPath } = get();
    if (!currentDeckPath) return;
    const elements = useCanvasStore.getState().elements;
    await invoke('write_canvas', {
      deckPath: currentDeckPath,
      content: JSON.stringify(elements),
    });
  },

  loadCanvas: async (deckPath: string) => {
    const content = await invoke<string>('read_canvas', { deckPath });
    if (!content.trim()) return false;
    try {
      const elements: CanvasElement[] = JSON.parse(content);
      useCanvasStore.getState().setElements(elements);
      return true;
    } catch (e) {
      console.warn('[loadCanvas] Failed to parse canvas:', e);
      return false;
    }
  },

  syncCardBackVisualToCode: () => {
    if (get().cardBackSyncSource === 'code') return;
    const design = get().cardBack;
    const { html, css } = cardBackDesignToHtmlCss(design);
    set({ cardBackSyncSource: 'visual', cardBackHtml: html, cardBackCss: css, isDirty: true });
    Promise.resolve().then(() => set({ cardBackSyncSource: null }));
  },

  syncCardBackCodeToVisual: () => {
    if (get().cardBackSyncSource === 'visual') return false;
    const { cardBackHtml, cardBackCss } = get();
    set({ cardBackSyncSource: 'code' });
    if (!cardBackHtml.trim()) {
      set({ cardBackSyncSource: null });
      return false;
    }
    const design = parseCardBackHtmlCss(cardBackHtml, cardBackCss);
    set({ cardBack: design, cardBackSyncSource: null, isDirty: true });
    return true;
  },

  saveCardBack: async () => {
    const { currentDeckPath, cardBack, cardBackHtml, cardBackCss, cardBackEditorMode } = get();
    if (!currentDeckPath) return;
    await invoke('write_card_back', { deckPath: currentDeckPath, design: cardBack });
    const { html, css } = cardBackEditorMode === 'code'
      ? { html: cardBackHtml, css: cardBackCss }
      : cardBackDesignToHtmlCss(cardBack);
    await invoke('write_card_back_template', { deckPath: currentDeckPath, html, css });
    set({ isDirty: false });
  },

  loadTemplate: async (deckPath: string) => {
    const loaded = await get().loadCanvas(deckPath);
    const files = await invoke<{ html: string; css: string }>('read_template', { deckPath });
    const manifest = useProjectStore.getState().manifest;
    const deckMeta = manifest?.decks.find(d => deckPath === d.path || deckPath.endsWith('/' + d.path) || deckPath.endsWith('\\' + d.path));
    set({
      html: files.html,
      css: files.css,
      isDirty: false,
      currentDeckPath: deckPath,
      currentCardSize: deckMeta?.cardSize ?? null,
    });
    if (!loaded) {
      get().syncCodeToVisual();
    }
  },

  loadCardBack: async (deckPath: string) => {
    const design = await invoke<CardBackDesign>('read_card_back', { deckPath });
    const files = await invoke<{ html: string; css: string }>('read_card_back_template', { deckPath });
    set({
      cardBack: design,
      cardBackHtml: files.html || cardBackDesignToHtmlCss(design).html,
      cardBackCss: files.css || cardBackDesignToHtmlCss(design).css,
      cardBackEditorMode: 'visual',
    });
  },
}));
