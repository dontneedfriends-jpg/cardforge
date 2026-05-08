# Решение проблемы Drag & Drop в CardForge

## Итог

DnD не работал из-за **одной корневой причины** в Tauri + нескольких сопутствующих проблем в React-коде.

---

## Корневая причина: Tauri/WebView2 блокирует drag-события

### Проблема

В Tauri на Windows WebView2 перехватывает все drag-события на уровне нативного слоя — **до того как они попадают в JavaScript**. Это сделано для поддержки drag файлов из проводника. В итоге `dragover`, `dragenter`, `drop` просто не доходили до JS. Работал только `dragstart` (он генерируется самим WebView, а не принимается снаружи).

**Симптом:** в консоли есть `[DnD] Drag start`, но нет ни одного `dragover`/`dragenter` — даже при вешании обработчика на `document` или `window`.

### Исправление: `src-tauri/tauri.conf.json`

```json
// было
{
  "title": "CardForge",
  ...
}

// стало
{
  "title": "CardForge",
  ...
  "dragDropEnabled": false
}
```

`"dragDropEnabled": false` отключает нативный обработчик DnD в WebView2. После этого все drag-события снова идут в JavaScript как обычно.

**Требует перезапуска `tauri dev` / пересборки.**

---

## Сопутствующая проблема: React synthetic events vs `react-rnd`

### Проблема

`react-rnd` рендерит абсолютно позиционированные `div`-ы поверх всего canvas. Они перехватывают React synthetic drag-события (`onDragOver`, `onDrop`), не давая им дойти до canvas.

### Исправление: `Canvas.tsx`

Заменили React `onDragEnter/onDragOver/onDragLeave/onDrop` на нативные `addEventListener` на `document` через `useEffect`.

**Стратегия:** вешать все drag-события на `document`, а не на canvas. Весь `document` принимает drag (браузер показывает нормальный курсор), а логика определения попадания в canvas — через `getBoundingClientRect()`:

```ts
useEffect(() => {
  const getCanvasRect = () => canvasRef.current?.getBoundingClientRect() ?? null;

  const isOverCanvas = (e: DragEvent): boolean => {
    const rect = getCanvasRect();
    if (!rect) return false;
    return (
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom
    );
  };

  const onDocDragOver = (e: DragEvent) => {
    e.preventDefault(); // без этого браузер показывает "no-drop" везде
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = isOverCanvas(e) ? 'copy' : 'none';
    }
    setIsDragOver(isOverCanvas(e));
  };

  const onDocDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isOverCanvas(e)) return; // игнорируем дроп вне canvas
    // ... создание элемента
  };

  document.addEventListener('dragover', onDocDragOver);
  document.addEventListener('drop', onDocDrop);
  return () => {
    document.removeEventListener('dragover', onDocDragOver);
    document.removeEventListener('drop', onDocDrop);
  };
}, []);
```

Актуальные значения `addElement` и `elements.length` передаются через `useRef` — чтобы не пересоздавать обработчики при каждом рендере:

```ts
const addElementRef = useRef(addElement);
addElementRef.current = addElement;
const elementsLengthRef = useRef(elements.length);
elementsLengthRef.current = elements.length;
```

---

## Дополнительные правки

### `Canvas.tsx` — индикатор hover

`border` при изменении создаёт layout shift и влияет на `getBoundingClientRect`. Заменено на `outline` (не влияет на размеры):

```ts
// было
border: isDragOver ? '2px dashed #60cdff' : undefined

// стало
outline: isDragOver ? '2px dashed #60cdff' : undefined,
outlineOffset: isDragOver ? '3px' : undefined,
```

### `ElementPanel.tsx` — `draggable` и `effectAllowed`

```tsx
// было
draggable
e.dataTransfer.effectAllowed = 'copy';

// стало
draggable="true"
e.dataTransfer.setData('text/plain', elementType); // fallback
e.dataTransfer.effectAllowed = 'copyMove'; // 'copy' иногда конфликтует с WebView2
```

---

## Файлы изменены

| Файл | Что изменено |
|------|-------------|
| `src-tauri/tauri.conf.json` | Добавлено `"dragDropEnabled": false` в конфиг окна |
| `src/features/template-editor/wysiwyg/Canvas.tsx` | React synthetic events заменены на `document.addEventListener` в `useEffect` |
| `src/features/template-editor/wysiwyg/ElementPanel.tsx` | `draggable="true"`, добавлен `text/plain` fallback, `effectAllowed = 'copyMove'` |

---

## Диагностика (как отлаживать DnD в Tauri)

Если DnD снова перестанет работать, первый шаг — проверить доходят ли события до JS:

```ts
// добавить в useEffect на время отладки
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  console.log('[DnD] window dragover', e.clientX, e.clientY);
});
```

- **`window dragover` не появляется** → Tauri снова включил нативный DnD, проверить `tauri.conf.json`
- **`window dragover` есть, но drop не работает** → проблема в координатах или `dataTransfer`
- **`dragstart` есть, `dragover` нет** → классический симптом `dragDropEnabled: true`
