# CardForge - Документация проекта

## Общее описание

CardForge — desktop IDE для дизайна игровых карт, вдохновлённое CIDEr. Приложение позволяет создавать карты с помощью HTML/CSS/Handlebars шаблонов и визуального WYSIWYG редактора, управлять данными в табличном формате и мгновенно видеть превью.

## Технологический стек

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Tauri 2 (Rust backend)
- **UI**: Fluent UI v9 + Mica Material Design
- **Роутинг**: TanStack Router
- **Состояние**: Zustand + Immer
- **Визуальный редактор**: Native HTML5 DnD + react-rnd (Craft.js удалён)
- **Кодовый редактор**: Monaco Editor (@monaco-editor/react)
- **Resizable панели**: react-resizable-panels
- **Шаблонизация**: Handlebars
- **CSV**: PapaParse

## Архитектура

```
cardforge/
├── src-tauri/              # Rust backend
│   └── src/commands/       # IPC команды
│       ├── project.rs      # Управление проектами
│       ├── csv_ops.rs      # Чтение/запись CSV
│       ├── template.rs     # Работа с шаблонами
│       ├── card_back.rs    # Рубашка карт
│       ├── assets.rs       # Управление ассетами
│       └── watcher.rs      # Файловый watcher
│
├── src/
│   ├── main.tsx            # Точка входа
│   ├── App.tsx             # Корневой компонент
│   ├── router.tsx          # Shell + роуты
│   ├── App.css             # Mica Design Tokens
│   │
│   ├── store/              # Zustand stores
│   │   ├── projectStore.ts # Проект + recent
│   │   ├── deckStore.ts    # Данные колод
│   │   ├── editorStore.ts  # HTML/CSS + sync state
│   │   ├── canvasStore.ts  # CanvasElement[] (WYSIWYG)
│   │   └── uiStore.ts      # UI состояние
│   │
│   ├── shared/
│   │   ├── types/project.ts      # TypeScript types
│   │   ├── templates/
│   │   │   └── cardTemplates.ts  # 14 шаблонов карт
│   │   └── components/
│   │       └── NavRail.tsx
│   │
│   ├── features/
│   │   ├── welcome/
│   │   │   ├── WelcomePage.tsx   # Стартовый экран
│   │   │   └── EditorPage.tsx    # 3-панельный layout
│   │   │
│   │   ├── project/
│   │   │   └── ProjectSidebar.tsx # Боковая панель
│   │   │
│   │   ├── template-editor/
│   │   │   ├── TemplateEditor.tsx     # Front/Back вкладки + Code/Visual
│   │   │   ├── CodeEditor.tsx         # Monaco HTML+CSS
│   │   │   ├── VisualEditor.tsx       # WYSIWYG редактор
│   │   │   ├── CardBackEditor.tsx     # Редактор рубашки
│   │   │   ├── HandlebarsHelper.ts    # Автокомплит
│   │   │   └── wysiwyg/
│   │   │       ├── Canvas.tsx         # Canvas с сеткой + react-rnd
│   │   │       ├── ElementPanel.tsx   # Панель элементов (native DnD)
│   │   │       ├── PropertiesPanel.tsx # Свойства элемента
│   │   │       ├── LayersPanel.tsx    # Дерево слоёв
│   │   │       ├── sync.ts            # CanvasElement[] ↔ HTML/CSS
│   │   │       └── elements/          # 8 типов элементов
│   │   │           ├── TextElement.tsx
│   │   │           ├── ImageElement.tsx
│   │   │           ├── ShapeElement.tsx
│   │   │           ├── CircleElement.tsx
│   │   │           ├── LineElement.tsx
│   │   │           ├── IconElement.tsx
│   │   │           ├── FieldBadge.tsx
│   │   │           └── ContainerElement.tsx
│   │   │
│   │   ├── data-editor/
│   │   │   └── DataEditor.tsx     # Таблица данных
│   │   │
│   │   ├── preview/
│   │   │   ├── PreviewPanel.tsx   # Превью карт
│   │   │   └── CardRenderer.ts    # Handlebars рендер
│   │   │
│   │   ├── simulator/
│   │   │   ├── SimulatorPage.tsx  # Оркестратор
│   │   │   ├── CardTable.tsx      # 3D игровой стол с переворотом
│   │   │   ├── DeckZone.tsx       # Панель колоды/руки/сброса
│   │   │   └── simulatorStore.ts  # Состояние симулятора
│   │   │
│   │   ├── assets/
│   │   │   └── AssetManager.tsx   # Управление ассетами
│   │   │
│   │   ├── export/
│   │   │   └── ExportPage.tsx     # Экспорт PNG/PDF
│   │   │
│   │   └── settings/
│   │       └── SettingsPage.tsx   # Настройки
│   │
│   └── theme/
│       └── index.ts         # mmToPx конвертер
```

## Mica Design System

### Философия
- **Слоистость**: элементы на разных уровнях прозрачности
- **Blur**: backdrop-filter для глубины
- **Субтильность**: минимальные тени, максимум прозрачности
- **Акцент**: #60cdff (голубой) только для интерактивных элементов

### Токены
```css
--mica-base: #202020              /* Базовый фон */
--mica-layer-1: rgba(255,255,255,0.05)  /* Поверхности */
--mica-layer-2: rgba(255,255,255,0.10)
--mica-layer-3: rgba(255,255,255,0.15)
--mica-stroke: rgba(255,255,255,0.08)   /* Границы */
--mica-accent: #60cdff            /* Акцент */
--mica-text-primary: #ffffff
--mica-text-secondary: rgba(255,255,255,0.65)
```

### Компоненты
- **mica-backdrop**: blur(100px) + градиент
- **mica-surface**: blur(40px) + border
- **mica-card**: border-radius 12px + hover-эффект
- **mica-button**: transition + hover

## Визуальный редактор (WYSIWYG)

### Архитектура
- **Технология**: Native HTML5 Drag & Drop + `react-rnd` (Craft.js удалён)
- **Причина**: Craft.js несовместим с React 18.2+ в Tauri WebView2
- **Исправление Tauri drag**: `dragDropEnabled: false` в `tauri.conf.json`

### Canvas
- Размер: 600×900px (стандартная карта)
- Сетка: 20px с подсветкой
- Drop: глобальные `document.addEventListener('dragover'/'drop')` вместо React events
- Элементы позиционируются абсолютно (X, Y, W, H, Rotation)

### 8 типов элементов
1. **Text** — текст с настройками шрифта
2. **Image** — статичное изображение или привязка к колонке
3. **Data Field** — привязка {{fieldName}} к CSV
4. **Rectangle** — прямоугольник с фоном/рамкой
5. **Circle** — круг/овал
6. **Line** — линия
7. **Icon** — символ/эмодзи
8. **Container** — контейнер с padding

### Двусторонняя синхронизация
- **Visual → Code**: `elementsToTemplate()` — CanvasElement[] → HTML/CSS
- **Code → Visual**: `parseTemplateToElements()` — HTML/CSS → CanvasElement[]
- **Защита**: `syncSource` флаг предотвращает бесконечные циклы
- **Режим**: Callback-based sync с debounce

### Хранение состояния
- `canvasStore.ts` — Zustand store для CanvasElement[]
- CRUD: addElement, updateElement, removeElement, reorderZIndex
- Сохранение: в папку колоды как `canvas.json` (TODO — не реализовано)

## Редактор рубашки (Card Back Editor)

### Front/Back вкладки
- **Front** — стандартный редактор шаблона (Code / Visual режимы)
- **Back** — визуальный редактор рубашки карты

### Параметры рубашки
1. **Background** — градиент (верхний/нижний цвет), выбор через color picker + hex input
2. **Border** — цвет и толщина (Slider 0-8px)
3. **Symbol** — центральный символ (текст до 4 символов), размер (Slider 12-72px), цвет
4. **Pattern** — тип узора (None / Stripes / Dots / Crosshatch), цвет, прозрачность (Slider 0-100%)
5. **Live Preview** — обновляется в реальном времени рядом с редактором

### Хранение
- Сохраняется как `card_back.json` в папке колоды
- Загружается автоматически при выборе колоды
- Кнопка "Save Card Back" в редакторе

### Использование в симуляторе
- Рубашка отображается на всех картах в симуляторе
- Карты с faceDown=true показывают рубашку вместо контента
- Применяется CSS rotateY(180deg) для переворота карты

## Текстовый редактор (Code)

### Monaco Editor
- HTML и CSS табы
- Handlebars автокомплит ({{fieldName}})
- Syntax highlighting
- Word wrap
- Minimap disabled

### Двусторонняя связь с Visual
- При переключении Code → Visual: HTML парсится в элементы
- При переключении Visual → Code: элементы сериализуются
- Предупреждение при потере несовместимого HTML

## Типы колонок (Data Editor)

1. **text** — обычный текст
2. **number** — SpinButton
3. **boolean** — Checkbox
4. **color** — color picker + hex input
5. **image** — thumbnail + путь к файлу
6. **enum** — Dropdown с опциями
7. **markdown** — Textarea

## Шаблоны карт (14 шаблонов)

### Реалистичные игры
- **Munchkin** — средневековый дизайн, золотые рамки
- **Fluxx** — яркие цветные полосы по типу карты
- **Exploding Kittens** — мультяшный стиль, котики

### Универсальные
- **Simple Card** — минималистичный
- **Creature** — RPG карта со статами (ATK/DEF/HP)
- **Spell** — заклинание с маной
- **Equipment** — предмет с редкостью
- **Location** — локация с уровнем опасности
- **Hero** — персонаж с характеристиками
- **Resource** — маленькая карта ресурса (41×63mm)
- **Minimal** — ультра-минималистичная

### Тематические
- **Sci-Fi / Cyberpunk** — неоновая сетка, светящийся текст, 3D трансформации
- **Horror / Gothic** — тёмный антиква, кроваво-красный, виньетка
- **Board Game Tile** — квадратная 70×70мм, 7 типов местности, ресурсы
- **TCG / Cardfight** — классический TCG лэйаут с эволюцией, HP, энергией

## Экспорт

### PNG
- Batch export через Rust + headless Chromium
- Настройка DPI (150/300/600)

### PDF
- Print-ready layout с crop marks
- Настройка bleed и page size

### Tabletop Simulator
- Spritesheet генерация
- JSON descriptor

## Хранение данных

### Формат проекта
```
project/
├── cardforge.json          # Манифест
├── assets/                 # Изображения
└── decks/
    └── creatures/
        ├── template.html
        ├── template.css
        ├── card_back.json
        ├── cards.csv
        └── canvas.json              # Состояние WYSIWYG редактора (TODO — не реализовано)
```

### Persist
- projectPath и recentProjects сохраняются в localStorage
- При старте — автоматическое открытие последнего проекта

## Клавиатурные сокращения

- **Ctrl+S** — сохранить шаблон
- **Ctrl+Shift+S** — сохранить всё
- **Ctrl+Z/Y** — undo/redo (только Code режим)

## Симулятор

### Функционал
- Drag-to-move карт по полю
- Fan layout для руки (раздача карт)
- Click на колоду — диалог выбора карты для розыгрыша (`drawSpecificCard`)
- Mica-стилизация всех элементов
- Face down / face up состояния
- CSS rotateY(180deg) для переворота карты
- Рубашка применяется на всех картах с `faceDown=true`

## Известные ограничения

1. **HTML Parser** — упрощённый, работает только с абсолютно позиционированными элементами
2. **Visual → Code** — теряет сложные CSS, сохраняет только inline позиционирование
3. **Icons** — Unicode символы вместо SVG
4. **Image drag & drop** — только через Import диалог
5. **Live sync** — callback-based, требует ручного нажатия кнопки sync

## Ключевые решения

1. **Удалён Craft.js** — Несовместим с React 18.2+ в Tauri WebView2
2. **Blob URLs для preview** — React не всегда перезагружает iframe с srcDoc
3. **Проект = папка файлов** — Git-friendly, без базы данных
4. **template.html — единый источник правды** — Всегда экспортируется
5. **Абсолютное позиционирование** — Только в визуальном редакторе
6. **dragDropEnabled: false** — Обязательно для работы HTML5 DnD в Tauri WebView2

## Критический контекст

- **Tauri WebView2 drag**: Блокирует HTML5 drag events, требует `dragDropEnabled: false` в `tauri.conf.json`
- **DOMParser bounding boxes**: `getBoundingClientRect()` возвращает 0 для элементов из DOMParser, нужно использовать inline styles
- **React StrictMode + zustand**: Может вызывать infinite re-render loops с subscribe
- **react-rnd**: Перехватывает React synthetic events, используем глобальные `document.addEventListener`
- **useDebounce**: Пакет `use-debounce` в зависимостях, но не импортируется (ручной setTimeout)

## Разработка

### Запуск
```bash
cd cardforge
npm run tauri dev
```

### Сборка
```bash
npm run tauri build
```

### TypeScript
```bash
npx tsc --noEmit
```

## Будущие улучшения

- [x] Работающий WYSIWYG редактор (native DnD + react-rnd)
- [x] Live preview с iframe srcdoc
- [x] Visual↔Code синхронизация через canvasStore
- [x] Симулятор с drag-to-move и fan layout
- [x] Card Back Editor + сохранение в card_back.json
- [x] 14 starter templates
- [ ] Стабилизировать live sync без infinite loops (syncSource guard)
- [ ] Сохранение/загрузка canvas state из папки колоды (canvas.json)
- [ ] Удалить мёртвые файлы: serializer.ts, htmlParser.ts, withPosition.tsx, PositionedWrapper.tsx, EmptyState.tsx, DeckList.tsx
- [ ] Удалить неиспользуемые npm пакеты: @tanstack/router-devtools, use-debounce
- [ ] Починить deckStore.saveData (относительный путь без projectPath)
- [ ] Починить NavRail inline :hover (не работает в React style prop)
- [ ] SVG иконки вместо Unicode
- [ ] Drag & drop для ассетов
- [ ] Undo/redo для Code режима
- [ ] Темы (light/dark/system)
- [ ] Кастомные шрифты
- [ ] TTS Spritesheet export
- [ ] PNG/PDF export с crop marks (Rust export.rs)
- [ ] Keyboard shortcuts (Ctrl+Z/Y, Ctrl+P, Ctrl+E, F5)
- [ ] Коллаборативное редактирование
- [ ] Cloud sync
- [ ] Marketplace шаблонов
