# Архитектурный план: двусторонняя синхронизация Code ↔ Visual

## 1. Структуры данных

### Расширенный `CanvasElement`

Ключевая идея: каждый элемент хранит **`sourceHtml`** — оригинальный HTML-фрагмент из которого он был создан. Это и есть "источник правды" при обратной генерации.

```
CanvasElement {
  // существующие поля
  id, type, x, y, width, height, rotation, opacity, zIndex, visible

  // визуальные props (тип-специфичные)
  props: {
    // text/field
    text?, fontSize?, fontWeight?, color?, textAlign?, fontFamily?,
    fieldName?

    // image
    src?, isField?, objectFit?

    // shape/circle/container
    background?, borderRadius?, borderWidth?, borderColor?, padding?

    // line
    color?, lineWidth?

    // icon
    iconName?, iconSize?
  }

  // НОВОЕ: сериализационные метаданные
  meta: {
    sourceHtml: string      // оригинальный HTML этого элемента (для round-trip)
    sourceSelector: string  // CSS-класс или data-атрибут для идентификации
    tagName: string         // div, span, img, p, h1...h6 и т.д.
    classList: string[]     // все CSS-классы
    inlineStyle: string     // оригинальный style="" атрибут
    customAttrs: Record<string, string>  // data-*, aria-* и т.д.
  }
}
```

### Идентификатор элемента

Каждый элемент при парсинге получает `data-cf-id` атрибут. При генерации HTML этот атрибут сохраняется. Это позволяет:
- точно сопоставить DOM-элемент с CanvasElement при повторном парсинге
- обеспечить идемпотентность round-trip

```html
<div data-cf-id="el_1234" class="hero-text" style="position:absolute;left:20px;top:10px;...">
```

### Манифест шаблона

```
TemplateManifest {
  version: 2
  cardSize: CardSize
  rootStyle: string        // CSS .card-root { ... }
  globalCss: string        // всё остальное из CSS кроме el-* классов
  elements: ElementManifest[]
}

ElementManifest {
  cfId: string
  selector: string         // как найти элемент в DOM
  type: CanvasElement['type']
  position: { x, y, width, height, rotation, opacity, zIndex }
}
```

Манифест встраивается в HTML как JSON в `<script type="application/cf-manifest">`. Это позволяет при парсинге сразу знать типы и позиции — не гадать.

---

## 2. Алгоритм парсинга HTML → CanvasElement

### Шаг 0: Проверка наличия манифеста

```
if (html содержит <script type="application/cf-manifest">)
  → использовать быстрый путь с манифестом (Section 2A)
else
  → использовать эвристический парсер (Section 2B)
```

### 2A: Быстрый путь (HTML сгенерирован Visual Editor)

1. Извлечь JSON манифеста из `<script type="application/cf-manifest">`
2. Для каждого `ElementManifest` найти DOM-элемент по `data-cf-id`
3. Восстановить `CanvasElement` из манифеста + `sourceHtml` из outerHTML элемента
4. Позиция берётся из манифеста (точная, не из CSS парсинга)

Результат: идемпотентный round-trip без потерь.

### 2B: Эвристический парсер (произвольный HTML)

Запускается когда нет манифеста — пользователь написал HTML руками.

**Алгоритм:**

```
1. DOMParser.parseFromString(html)
2. Найти корневой элемент:
   - .card-root если есть
   - иначе <body> первый дочерний блочный элемент
3. Применить CSS к DOM (createStyleSheet + getComputedStyle)
   - это нужно чтобы узнать реальный computed style каждого элемента
4. Для каждого дочернего элемента корня:
   a. Определить позицию (см. алгоритм позиции ниже)
   b. Определить тип (см. алгоритм типа ниже)
   c. Извлечь props (тип-специфично)
   d. Создать CanvasElement с meta.sourceHtml = outerHTML
```

**Алгоритм определения позиции:**

```
1. Если position: absolute/fixed — читать left/top/width/height напрямую
2. Если position: relative/static — вычислить offsetLeft/offsetTop
   (для этого нужно добавить элемент в скрытый iframe с реальными размерами карты)
3. width/height: если задан явно — использовать; иначе getBoundingClientRect()
4. rotation: из transform: rotate(Ndeg) или transform матрицы
5. opacity: из opacity или rgba alpha
6. zIndex: из z-index; для статичных — порядок в DOM (индекс * 10)
```

**Измерительный iframe:**
```
Создать скрытый <iframe style="position:fixed;width:{cardW}px;height:{cardH}px;visibility:hidden">
Вставить полный HTML+CSS
Подождать load
Вызвать getBoundingClientRect() для каждого элемента
Удалить iframe
```
Это единственный надёжный способ получить реальные размеры при статичном layout.

**Алгоритм определения типа элемента:**

```
tagName === 'img'                              → type: 'image'
tagName === 'img' внутри единственного child  → type: 'image'
innerText содержит {{fieldName}}               → type: 'field'
tagName в ['p','span','div','h1-h6']
  && нет children кроме text nodes             → type: 'text'
tagName === 'hr' или display: 'flex' +
  единственный child — горизонтальная линия   → type: 'line'
borderRadius >= 50% и width ≈ height           → type: 'circle'
имеет children && overflow не hidden           → type: 'container'
display: flex/grid && children > 0             → type: 'container'
иначе                                          → type: 'shape'
```

**Извлечение props по типу:**

```
text/field:
  text = innerText (strip {{...}} для field)
  fontSize = computedStyle.fontSize (parseInt)
  fontWeight = computedStyle.fontWeight
  color = computedStyle.color (→ hex конвертация)
  textAlign = computedStyle.textAlign
  fontFamily = computedStyle.fontFamily
  для field: fieldName = innerText.match(/\{\{(.+?)\}\}/)[1]

image:
  src = img.getAttribute('src') — НЕ currentSrc (чтобы сохранить assets/ путь)
  isField = src.startsWith('{{')
  fieldName = если isField → src.slice(2,-2)
  objectFit = computedStyle.objectFit

shape/circle/container:
  background = computedStyle.backgroundColor или background (gradient)
  borderRadius = computedStyle.borderRadius (parseInt)
  borderWidth = computedStyle.borderWidth
  borderColor = computedStyle.borderColor
  padding = computedStyle.padding (для container)

line:
  найти child div с height <= 4px и width > 50%
  color = его backgroundColor
  lineWidth = его clientHeight

icon:
  innerText одиночный символ → сопоставить с iconMap (обратный lookup)
  fontSize → iconSize
  color
```

---

## 3. Алгоритм генерации CanvasElement → HTML

### Принцип: приоритет `meta.sourceHtml`

```
для каждого элемента:
  if (el.meta.sourceHtml && el.meta.cfId)
    → взять sourceHtml как базу
    → ТОЛЬКО обновить позиционные атрибуты в style
    → НЕ трогать содержимое, классы, другие стили
  else
    → генерировать HTML из props (как сейчас)
```

**Обновление позиции в sourceHtml:**

```typescript
function injectPosition(sourceHtml: string, el: CanvasElement): string {
  // Парсим sourceHtml
  // Находим первый тег
  // Обновляем style атрибут: заменяем/добавляем
  //   position:absolute; left:{x}px; top:{y}px;
  //   width:{w}px; height:{h}px;
  //   transform:rotate({r}deg) — если rotation != 0
  //   opacity:{o} — если opacity != 1
  //   z-index:{z}
  // Добавляем/обновляем data-cf-id="{id}"
  return updatedHtml;
}
```

Ключевое: мы меняем **только** позиционные свойства. Если пользователь написал `color: red; font-size: 24px; custom-class` — всё это сохраняется.

### Генерация CSS

```
1. Начать с rootCss (из манифеста или дефолтный .card-root)
2. Добавить globalCss (пользовательские стили из манифеста)
3. Для каждого элемента без sourceHtml — сгенерировать CSS класс как сейчас
4. Элементы с sourceHtml не добавляют CSS (их стили уже инлайновые или в globalCss)
```

### Встраивание манифеста

```
finalHtml = cardRootHtml + '\n' + manifestScript

manifestScript = `<script type="application/cf-manifest">
${JSON.stringify(manifest, null, 0)}
</script>`
```

Манифест содержит **только** позиции и типы — не весь HTML повторно. Это минимально необходимое.

---

## 4. Обеспечение идемпотентности

### Источники нарушения идемпотентности и их решения:

**Проблема 1: Color round-trip**
`rgb(255, 0, 0)` → props.color → `#ff0000` → CSS → `rgb(255, 0, 0)` ≠ `#ff0000`

Решение: нормализовать все цвета в hex при парсинге. Написать `rgbToHex(computedStyle.color)`. При генерации всегда писать hex.

**Проблема 2: Позиция из computed vs inline**
`margin: auto` вычисляется в конкретный px. При генерации это px → при парсинге снова px → идентично.

Решение: всегда писать позицию в `px` явно.

**Проблема 3: CSS классы**
Пользовательские классы `.hero-text { font-size: 24px }` — при генерации мы вставляем инлайн стили, теряя класс.

Решение: `meta.sourceHtml` сохраняет оригинальный тег с классами. Мы только добавляем позицию, не трогая классы. CSS класс остаётся в `globalCss`.

**Проблема 4: Порядок элементов**
DOMParser возвращает элементы в DOM-порядке. zIndex может не совпадать с DOM-порядком.

Решение: при генерации HTML сортировать элементы по zIndex (меньший zIndex = раньше в DOM). Сортировка стабильная.

**Проблема 5: Пробелы и форматирование**
Никогда не сравнивать HTML строки напрямую для проверки идемпотентности. Сравнивать только структуру через DOM.

### Тест идемпотентности:
```
html1 = elementsToTemplate(parseTemplateToElements(originalHtml))
html2 = elementsToTemplate(parseTemplateToElements(html1))
assert DOM(html1) ≡ DOM(html2)  // структурное равенство
```

---

## 5. Edge Cases

| Случай | Решение |
|--------|---------|
| `<img>` без явных размеров | Измерительный iframe даёт реальные размеры после load |
| `background: linear-gradient(...)` | Хранить как строку в props.background, не парсить |
| Вложенные элементы (div внутри div) | Парсить только первый уровень дочерних. Вложенные — часть container.sourceHtml |
| `transform: rotate(45deg) scale(1.2)` | Извлекать только rotate; остальное хранить в meta.inlineStyle |
| SVG элементы | type: 'icon' если простой символ; иначе type: 'shape' с sourceHtml |
| `{{fieldName}}` в src изображения | Правильно обработан: isField=true |
| Элементы с `display: none` | visible: false; включать в canvas |
| Элементы вне .card-root | Игнорировать |
| Malformed HTML | DOMParser исправляет автоматически; логировать предупреждение |
| CSS переменные `var(--color)` | Хранить as-is в props; computedStyle разрешит при измерении |
| `position: sticky/fixed` | Трактовать как absolute с вычисленными координатами |
| Canvas пустой (0 элементов) | Возвращать только card-root div, не null |
| Очень большой HTML (>100 элементов) | Измерительный iframe с setTimeout batching |

---

## 6. Порядок реализации

### Фаза 1: Фундамент (не ломает текущее)

**Шаг 1.1** — Добавить `meta` поле в тип `CanvasElement` (optional, не breaking change)

**Шаг 1.2** — Добавить `data-cf-id` генерацию в `elementsToTemplate()`. Существующий HTML не ломается — атрибут просто игнорируется браузером.

**Шаг 1.3** — Добавить встраивание манифеста в `elementsToTemplate()` как `<script type="application/cf-manifest">`. Preview не сломается — браузер игнорирует script в body iframe.

**Шаг 1.4** — Написать `rgbToHex()` и `normalizeColor()` утилиты. Покрыть тестами.

### Фаза 2: Улучшение парсера

**Шаг 2.1** — Быстрый путь: парсить манифест если есть. Тест: `parse(generate(elements))` возвращает идентичные элементы.

**Шаг 2.2** — Измерительный iframe. Сделать как отдельный хук `useMeasureTemplate(html, css, cardSize): DOMRect[]`. Тест: известный HTML → проверить что позиции совпадают с ожидаемыми.

**Шаг 2.3** — Эвристический парсер типов. Тест: набор HTML-снипетов для каждого типа → проверить что тип определяется верно.

**Шаг 2.4** — Извлечение props по типам. Тест: для каждого типа — roundtrip props через generate/parse.

### Фаза 3: Roundtrip через sourceHtml

**Шаг 3.1** — В `elementsToTemplate()` для элементов с `meta.sourceHtml`: использовать sourceHtml + `injectPosition()`.

**Шаг 3.2** — Написать `injectPosition()`. Тест: sourceHtml с разными комбинациями существующих style → проверить что только позиционные поля обновились.

**Шаг 3.3** — Тест идемпотентности: `generate(parse(generate(parse(html))))` == `generate(parse(html))`.

### Фаза 4: Переключение режимов

**Шаг 4.1** — Убрать диалог "Switch Anyway". Вместо него — просто вызвать `syncCodeToVisual()` или `syncVisualToCode()`.

**Шаг 4.2** — Исправить `syncCodeToVisual()` в editorStore: убрать fallback "container с rawHtml". Если парсер вернул null — показать toast "Could not parse template" и остаться в Code режиме.

**Шаг 4.3** — Исправить `syncVisualToCode()`: передавать `currentCardSize` из store вместо хардкода.

**Шаг 4.4** — Исправить debounce в `CodeEditor`: проверять `editorMode !== 'code'` → нет смысла. Синхронизация Code→Visual нужна только при явном переключении, не на каждый keystroke. Оставить debounce только для Preview refresh.

### Фаза 5: Edge cases и polish

**Шаг 5.1** — Обработка SVG, gradient backgrounds, CSS переменных.

**Шаг 5.2** — Batching для больших шаблонов (>50 элементов).

**Шаг 5.3** — Fallback strategy: если элемент не парсится в известный тип — создавать `type: 'shape'` с `meta.sourceHtml`. Элемент будет виден на canvas как серый прямоугольник, при генерации HTML вернётся оригинал.

---

## 7. Тестирование каждого шага

### Unit тесты (Vitest)

```
sync.test.ts:
  - rgbToHex('rgb(255, 0, 0)') === '#ff0000'
  - normalizeColor('rgba(255,0,0,0.5)') === 'rgba(255,0,0,0.5)'
  - elementsToTemplate([textElement]) → contains data-cf-id
  - elementsToTemplate([textElement]) → contains cf-manifest script
  - parseTemplateToElements(generatedHtml) → same elements (idempotence)
  - injectPosition(sourceHtml, updatedPos) → only position changed

Для каждого типа элемента:
  - generate(textEl) → parse → same text, fontSize, color, position
  - generate(imageEl) → parse → same src, isField
  - generate(shapeEl) → parse → same background, borderRadius
```

### Integration тесты

```typescript
// roundtrip.test.ts
const html1 = elementsToTemplate(elements, cardSize).html
const parsed = parseTemplateToElements(html1, css)
const html2 = elementsToTemplate(parsed!, cardSize).html
expect(domEqual(html1, html2)).toBe(true)
```

### Manual тест-матрица

| Сценарий | Ожидаемый результат |
|----------|---------------------|
| Пустой Code Editor → Visual | Пустой canvas |
| Написать `<div style="position:absolute;left:10px;top:20px;width:100px;height:50px;color:red">Hello</div>` → Visual | Text element, x=10, y=20, w=100, h=50, color=#ff0000, text=Hello |
| Добавить Text element в Visual → Code | `<span data-cf-id="..." style="position:absolute;...">` с текстом |
| Code → Visual → двинуть элемент → Code | Только left/top изменились, остальное сохранено |
| Сложный HTML с классами и вложениями → Visual → Code | Классы сохранены, позиция обновлена |

---

## Затронутые файлы при реализации

| Файл | Изменения |
|------|-----------|
| `src/store/canvasStore.ts` | Добавить `meta` поле в `CanvasElement` |
| `src/features/template-editor/wysiwyg/sync.ts` | Полная переработка `elementsToTemplate` и `parseTemplateToElements` |
| `src/store/editorStore.ts` | Исправить `syncVisualToCode` (cardSize), `syncCodeToVisual` (убрать fallback) |
| `src/features/template-editor/TemplateEditor.tsx` | Убрать диалог "Switch Anyway" |
| `src/features/template-editor/CodeEditor.tsx` | Исправить debounce логику |
| `src/features/template-editor/wysiwyg/sync.utils.ts` | Новый файл: `rgbToHex`, `normalizeColor`, `injectPosition` |
