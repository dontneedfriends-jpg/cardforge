import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CellValue } from '../../shared/types/project';

export interface PlayedCard {
  id: string;
  rowIndex: number;
  deckId: string;
  x: number;
  y: number;
  rotation: number;
  rotate3dX: number;
  rotate3dY: number;
  faceDown: boolean;
}

export interface SimulatorState {
  deck: PlayedCard[];
  hand: PlayedCard[];
  playArea: PlayedCard[];
  discard: PlayedCard[];
}

export interface SimulatorActions {
  loadDeck: (rows: Record<string, CellValue>[], deckId: string) => void;
  shuffle: () => void;
  drawCard: () => void;
  drawCards: (count: number) => void;
  drawSpecificCard: (rowIndex: number) => void;
  playCard: (id: string) => void;
  discardCard: (id: string, from: 'hand' | 'playArea') => void;
  flipCard: (id: string) => void;
  alignCard: (id: string) => void;
  rotateCard: (id: string) => void;
  rotateCard3d: (id: string, rotateX: number, rotateY: number) => void;
  moveCard: (id: string, x: number, y: number) => void;
  returnToDeck: (id: string) => void;
  resetGame: () => void;
}

type SimulatorStore = SimulatorState & SimulatorActions;

const createCard = (rowIndex: number, deckId: string): PlayedCard => ({
  id: `card_${deckId}_${rowIndex}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  rowIndex,
  deckId,
  x: 0,
  y: 0,
  rotation: 0,
  rotate3dX: 0,
  rotate3dY: 0,
  faceDown: false,
});

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const useSimulatorStore = create<SimulatorStore>()(
  immer((set, _get) => ({
    deck: [],
    hand: [],
    playArea: [],
    discard: [],

    loadDeck: (rows, deckId) => {
      const cards = rows.map((_row, i) => createCard(i, deckId));
      set((state) => {
        state.deck = cards;
        state.hand = [];
        state.playArea = [];
        state.discard = [];
      });
    },

    shuffle: () => {
      set((state) => {
        state.deck = fisherYates(state.deck);
      });
    },

    drawCard: () => {
      set((state) => {
        if (state.deck.length === 0) return;
        const card = state.deck.shift()!;
        state.hand.push(card);
      });
    },

    drawCards: (count: number) => {
      set((state) => {
        for (let i = 0; i < count; i++) {
          if (state.deck.length === 0) break;
          const card = state.deck.shift()!;
          state.hand.push(card);
        }
      });
    },

    drawSpecificCard: (rowIndex: number) => {
      set((state) => {
        const idx = state.deck.findIndex((c) => c.rowIndex === rowIndex);
        if (idx === -1) return;
        const [card] = state.deck.splice(idx, 1);
        state.hand.push(card);
      });
    },

    playCard: (id: string) => {
      set((state) => {
        const idx = state.hand.findIndex((c) => c.id === id);
        if (idx === -1) return;
        const [card] = state.hand.splice(idx, 1);
        card.x = 100 + Math.random() * 300;
        card.y = 100 + Math.random() * 200;
        state.playArea.push(card);
      });
    },

    discardCard: (id: string, from: 'hand' | 'playArea') => {
      set((state) => {
        const src = from === 'hand' ? state.hand : state.playArea;
        const idx = src.findIndex((c) => c.id === id);
        if (idx === -1) return;
        const [card] = src.splice(idx, 1);
        state.discard.push(card);
      });
    },

    flipCard: (id: string) => {
      set((state) => {
        const all = [...state.deck, ...state.playArea, ...state.hand, ...state.discard];
        const card = all.find((c) => c.id === id);
        if (card) card.faceDown = !card.faceDown;
      });
    },

    alignCard: (id: string) => {
      set((state) => {
        const all = [...state.deck, ...state.playArea, ...state.hand, ...state.discard];
        const card = all.find((c) => c.id === id);
        if (card) {
          card.rotation = 0;
          card.rotate3dX = 0;
          card.rotate3dY = 0;
        }
      });
    },

    rotateCard: (id: string) => {
      set((state) => {
        const all = [...state.deck, ...state.playArea, ...state.hand, ...state.discard];
        const card = all.find((c) => c.id === id);
        if (card) card.rotation = (card.rotation + 45) % 360;
      });
    },

    rotateCard3d: (id: string, rotateX: number, rotateY: number) => {
      set((state) => {
        const all = [...state.deck, ...state.playArea, ...state.hand, ...state.discard];
        const card = all.find((c) => c.id === id);
        if (card) {
          card.rotate3dX = rotateX;
          card.rotate3dY = rotateY;
        }
      });
    },

    moveCard: (id: string, x: number, y: number) => {
      set((state) => {
        const inHandIdx = state.hand.findIndex((c) => c.id === id);
        if (inHandIdx !== -1) {
          const [card] = state.hand.splice(inHandIdx, 1);
          card.x = x;
          card.y = y;
          state.playArea.push(card);
          return;
        }
        const card = state.playArea.find((c) => c.id === id);
        if (card) {
          card.x = x;
          card.y = y;
        }
      });
    },

    returnToDeck: (id: string) => {
      set((state) => {
        const areas: ('hand' | 'playArea' | 'discard')[] = ['hand', 'playArea', 'discard'];
        for (const area of areas) {
          const idx = state[area].findIndex((c) => c.id === id);
          if (idx !== -1) {
            const [card] = state[area].splice(idx, 1);
            state.deck.push(card);
            break;
          }
        }
      });
    },

    resetGame: () => {
      set((state) => {
        const all = [...state.hand, ...state.playArea, ...state.discard];
        state.deck.push(...all);
        state.hand = [];
        state.playArea = [];
        state.discard = [];
        state.deck = fisherYates(state.deck);
      });
    },
  }))
);
