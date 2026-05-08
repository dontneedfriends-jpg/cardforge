# Проблема с Drag & Drop в WYSIWYG редакторе CardForge

## Описание проблемы
В визуальном редакторе карточек (CardForge) перетаскивание элементов из левой панели на canvas не работает. Событие `dragstart` срабатывает (видно в консоли), но события `dragover` и `drop` на canvas не вызываются. Элемент "некуда бросить".

## Стек
- React 18.2 + TypeScript + Vite
- Fluent UI v9 (makeStyles)
- react-rnd (для перемещения/ресайза элементов на canvas)
- Zustand + Immer (для стейта)

## Ключевые файлы

### 1. `src/features/template-editor/wysiwyg/ElementPanel.tsx`
Панель с элементами для drag. Использует HTML5 draggable API.

```tsx
function DraggableItem({ icon, label, elementType }: DraggableItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    console.log('[DnD] Drag start:', elementType); // ЭТО РАБОТАЕТ
    e.dataTransfer.setData('elementType', elementType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={styles.item} draggable onDragStart={handleDragStart}>
      {icon}
      <Text className={styles.label}>{label}</Text>
    </div>
  );
}
```

### 2. `src/features/template-editor/wysiwyg/Canvas.tsx`
Canvas для drop элементов.

```tsx
export function Canvas({ widthMm, heightMm }: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const addElement = useCanvasStore((state) => state.addElement);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    console.log('[DnD] Drag enter canvas'); // НЕ РАБОТАЕТ
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    console.log('[DnD] Drag over canvas'); // НЕ РАБОТАЕТ
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    console.log('[DnD] Drag leave canvas'); // НЕ РАБОТАЕТ
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    console.log('[DnD] Drop on canvas'); // НЕ РАБОТАЕТ
    const type = e.dataTransfer.getData('elementType');
    if (!type) return;
    // ... создание элемента
  }, []);

  return (
    <div className={styles.container}>
      <div
        ref={canvasRef}
        className={styles.canvas}
        style={{ width: cardW, height: cardH }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Здесь рендерятся Rnd компоненты с существующими элементами */}
      </div>
    </div>
  );
}
```

### 3. Стили Canvas
```tsx
const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    overflow: 'auto',
    padding: '24px',
  },
  canvas: {
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
    background: '#1a1a2e',
    borderRadius: '8px',
    flexShrink: 0,
  },
});
```

### 4. Структура VisualEditor
```tsx
<div className={styles.container}>  {/* flex row */}
  <div className={styles.leftPanel}>  {/* 200px, ElementPanel */}
  <div className={styles.center}>     {/* flex:1, Canvas */}
  <div className={styles.rightPanel}> {/* 240px, Properties */}
</div>
```

## Что было попробовано
1. ✅ Понизили React с 19 до 18.2 (убрали ошибку с element.ref)
2. ✅ Удалили Craft.js (был несовместим)
3. ✅ Перешли на чистый HTML5 Drag & Drop API
4. ✅ Добавили `e.preventDefault()` в `onDragOver`
5. ✅ Добавили логи — `dragstart` работает, остальные события нет
6. ✅ Пробовали разные способы ref (useRef, callback ref)
7. ✅ Canvas имеет чёткие размеры (width/height в px)

## Возможные причины
- z-index или pointer-events блокируют события
- Родительский контейнер перехватывает события
- React synthetic events конфликтуют
- Rnd компоненты (react-rnd) перекрывают canvas

## Задача
Исправить код так, чтобы:
1. `dragover` и `drop` события срабатывали на canvas
2. Элементы из панели можно было бросить на canvas
3. После drop создавался новый элемент через `addElement()`

Пришли исправленный код для `Canvas.tsx` и `ElementPanel.tsx` с пояснением, что было не так.
