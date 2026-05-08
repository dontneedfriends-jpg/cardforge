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
  backgroundBottom: string;
  borderColor: string;
  borderWidth: number;
  symbol: string;
  symbolSize: number;
  symbolColor: string;
  pattern: 'none' | 'stripes' | 'dots' | 'crosshatch';
  patternColor: string;
  patternOpacity: number;
}

export interface DeckData {
  meta: DeckMeta;
  columns: Column[];
  rows: Record<string, CellValue>[];
}
