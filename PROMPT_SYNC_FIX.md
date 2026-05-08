# Проблема: Maximum update depth exceeded в CardForge

## Описание проблемы
При попытке сделать live синхронизацию между Visual Editor (canvas с элементами) и Code Editor (Monaco Editor с HTML/CSS) происходит зацикливание React: `Maximum update depth exceeded`.

## Текущая архитектура

### Store (Zustand)

**`src/store/editorStore.ts`**:
```typescript
interface EditorStore {
  html: string;
  css: string;
  // ...
  syncVisualToCode: (cardSize: CardSize) => void;  // Конвертирует canvas elements → HTML/CSS
  syncCodeToVisual: () => void;  // Парсит HTML/CSS → canvas elements
}
```

**`src/store/canvasStore.ts`**:
```typescript
interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'circle' | 'line' | 'icon' | 'field' | 'container';
  x: number; y: number;
  width: number; height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  props: Record<string, any>;
}

interface CanvasStore {
  elements: CanvasElement[];
  selectedId: string | null;
  addElement: (element: Omit<CanvasElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateElementProps: (id: string, props: Record<string, any>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
  setElements: (elements: CanvasElement[]) => void;
  clearCanvas: () => void;
}
```

### Компоненты

**`src/features/template-editor/wysiwyg/Canvas.tsx`**:
- Рендерит `CanvasElement[]` через `react-rnd` для drag/resize
- Принимает drop из левой панели (HTML5 DnD)
- НЕ ДОЛЖЕН синхронизироваться при каждом рендере
- Синхронизация нужна ТОЛЬКО при:
  - `addElement` (drop из панели)
  - `onDragStop` (окончание перемещения)
  - `onResizeStop` (окончание ресайза)
  - `deleteElement`
  - Изменение свойств через `PropertiesPanel`

**`src/features/template-editor/CodeEditor.tsx`**:
- Monaco Editor для HTML и CSS
- НЕ ДОЛЖЕН синхронизироваться при каждом рендере
- Синхронизация нужна ТОЛЬКО при:
  - `onChange` Monaco Editor (с debounce 500ms)

### Синхронизатор

**`src/features/template-editor/wysiwyg/sync.ts`**:
```typescript
export function elementsToTemplate(elements: CanvasElement[], cardSize: CardSize): { html: string; css: string }
export function parseTemplateToElements(html: string, css: string): CanvasElement[] | null
```

## Что нужно сделать

Реализовать **live синхронизацию без зацикливания**:

1. **Visual → Code**: При изменении canvas (drop, dragStop, resizeStop, delete, updateProps) → конвертировать в HTML/CSS → записать в editorStore
2. **Code → Visual**: При изменении HTML/CSS в Monaco (onChange с debounce) → парсить в elements → записать в canvasStore

**Ключевое требование**: НЕ ДОЛЖНО быть автоматической синхронизации при рендере или через subscribe. Только по конкретным действиям пользователя.

## Проблемы которые уже были

- Попытка использовать `useEffect` в Canvas с зависимостью `[elements]` → зацикливание
- Попытка использовать zustand `subscribe` вне React → зацикливание
- Попытка использовать кнопки ручной синхронизации → пользователь хочет live

## Требования к решению

1. **Без useEffect для синхронизации** - не использовать useEffect с зависимостью от elements/html/css
2. **Без zustand subscribe** - не использовать подписки вне React
3. **Live** - синхронизация происходит сразу после действия пользователя (с debounce для typing в Monaco)
4. **Надёжно** - защита от циклов: visual→code не должен вызывать code→visual и наоборот

## Файлы которые можно менять

- `src/features/template-editor/wysiwyg/Canvas.tsx`
- `src/features/template-editor/CodeEditor.tsx`
- `src/store/editorStore.ts`
- `src/store/canvasStore.ts`

## Вопросы

1. Как лучше организовать live синхронизацию без зацикливания?
2. Использовать флаг `isSyncing` в store? Или `lastSyncSource: 'visual' | 'code'`?
3. Или может быть callback-подход: Canvas явно вызывает syncVisualToCode() после действий, а CodeEditor вызывает syncCodeToVisual() после onChange?

Пришли готовое решение с кодом.
