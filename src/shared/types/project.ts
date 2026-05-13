export type ColumnType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'color'
  | 'image'
  | 'enum'
  | 'markdown';

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  enumValues?: string[];
  defaultValue?: CellValue;
}

export type CellValue = string | number | boolean | null;

export type EditorMode = 'code' | 'visual';

export interface CardInstance {
  id: string;
  rowIndex: number;
  deckId: string;
}

export interface PdfExportOptions {
  dpi: number;
  bleed: number;
  pageSize: 'A4' | 'Letter';
  cropMarks: boolean;
  lowInk: boolean;
}

export interface TtsExportResult {
  spritesheetPath: string;
  jsonPath: string;
  numWidth: number;
  numHeight: number;
}

export interface AssetInfo {
  name: string;
  path: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export interface TemplateFiles {
  html: string;
  css: string;
  craftjs: string | null;
}

export interface CardForgeManifest {
  version: string;
  name: string;
  decks: DeckMeta[];
  boards: BoardMeta[];
}

export interface BoardMeta {
  id: string;
  name: string;
  path: string;
  widthMm: number;
  heightMm: number;
}

export interface DeckMeta {
  id: string;
  name: string;
  path: string;
  cardSize: CardSize;
}

export interface CardSize {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
}

export interface CardBackDesign {
  backgroundTop: string;
  backgroundMid: string;
  backgroundBottom: string;
  gradientAngle: number;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shadowColor: string;
  shadowSize: number;
  symbol: string;
  symbolSet: string;
  symbolSize: number;
  symbolColor: string;
  symbol2: string;
  symbol2Size: number;
  symbol2Color: string;
  pattern: 'none' | 'stripes' | 'dots' | 'crosshatch';
  patternColor: string;
  patternOpacity: number;
  textureUrl: string;
  textureOpacity: number;
}

export interface DeckData {
  meta: DeckMeta;
  columns: Column[];
  rows: Record<string, CellValue>[];
}
