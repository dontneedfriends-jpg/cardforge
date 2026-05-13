export interface CardSizePreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  note?: string;
}

export const CARD_SIZE_PRESETS: CardSizePreset[] = [
  // Micro / Mini
  { id: 'chit_12mm', name: 'Chit ½″', widthMm: 12.7, heightMm: 12.7, bleedMm: 1.5, note: 'wargame counters' },
  { id: 'chit_16mm', name: 'Chit ⅝″', widthMm: 15.875, heightMm: 15.875, bleedMm: 1.5, note: 'wargame counters' },
  { id: 'chit_19mm', name: 'Chit ¾″', widthMm: 19.05, heightMm: 19.05, bleedMm: 1.5, note: 'wargame counters' },
  { id: 'micro', name: 'Micro', widthMm: 22, heightMm: 34, bleedMm: 2, note: 'micro games' },
  { id: 'tiny', name: 'Tiny', widthMm: 25, heightMm: 38, bleedMm: 2, note: 'micro games' },
  { id: 'mini_american', name: 'Mini American', widthMm: 41, heightMm: 63, bleedMm: 3, note: 'most common mini' },
  { id: 'mini_square_44', name: 'Mini Square 44', widthMm: 44, heightMm: 44, bleedMm: 3, note: 'square mini' },
  { id: 'mini_euro', name: 'Mini Euro', widthMm: 44, heightMm: 67, bleedMm: 3, note: 'slightly larger mini' },
  { id: 'mini_v2', name: 'Mini 45x68', widthMm: 45, heightMm: 68, bleedMm: 3, note: 'variant mini' },
  { id: 'square_55', name: 'Small Square', widthMm: 55, heightMm: 55, bleedMm: 3, note: 'Hive, etc.' },

  // Standard playing card sizes
  { id: 'bridge', name: 'Bridge', widthMm: 57, heightMm: 89, bleedMm: 3, note: 'trick-taking games' },
  { id: 'euro', name: 'Euro (German)', widthMm: 59, heightMm: 92, bleedMm: 3, note: 'European board games' },
  { id: 'standard_american', name: 'Standard American', widthMm: 62, heightMm: 88, bleedMm: 3, note: 'American board games' },
  { id: 'poker', name: 'Poker', widthMm: 63, heightMm: 88, bleedMm: 3, note: 'most common card size' },
  { id: 'japanese', name: 'Japanese (Standard)', widthMm: 63, heightMm: 88, bleedMm: 3, note: 'same as Poker' },

  // Square / Oversized
  { id: 'tarot', name: 'Tarot / Large', widthMm: 65, heightMm: 100, bleedMm: 3, note: 'oracle cards' },
  { id: 'square_70', name: 'Square 70', widthMm: 70, heightMm: 70, bleedMm: 3, note: 'unique games' },
  { id: 'square_80', name: 'Square 80', widthMm: 80, heightMm: 80, bleedMm: 3, note: 'oversized tiles' },
  { id: 'tabloid', name: 'Tabloid', widthMm: 76, heightMm: 120, bleedMm: 3, note: 'oversized cards' },
  { id: 'jumbo', name: 'Jumbo', widthMm: 90, heightMm: 130, bleedMm: 5, note: 'oversized cards' },
  { id: 'a6', name: 'A6 (Postcard)', widthMm: 105, heightMm: 148, bleedMm: 5, note: 'postcard size' },
  { id: 'a5', name: 'A5 (Half Letter)', widthMm: 148, heightMm: 210, bleedMm: 5, note: 'half A4' },
];

export const DEFAULT_CARD_SIZE = { widthMm: 63, heightMm: 88, bleedMm: 3 };

export function findPreset(widthMm: number, heightMm: number): CardSizePreset | undefined {
  return CARD_SIZE_PRESETS.find(
    p => Math.abs(p.widthMm - widthMm) < 0.5 && Math.abs(p.heightMm - heightMm) < 0.5
  );
}
