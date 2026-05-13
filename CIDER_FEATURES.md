# Фичи из Cider для CardForge

Анализ проекта [oatear/cider](https://github.com/oatear/cider) — Card IDE на Angular/Electron.

---

## Топ-5 фич для имплементации

### 1. Asset Generator (Генератор заглушек)

Процедурная генерация SVG-заглушек для прототипирования карт.

**Типы генерации:**
- Symbol — иконка 64×64 (blob/star/convex shapes)
- Art — арт 640×480
- Background — фон карты 500×700
- Badge — бейдж 64×64
- Banner — баннер 640×100
- Textbox — текстбокс 640×320

**Параметры:** форма (blob/star/convex/none), mirror (vertical/horizontal/both/none), цвета (front, back, outline, background), turbulence (hand-drawn effect), размеры.

**UX:** генерация 5 вариантов сразу, превью-миниатюры, сохранение в Asset Library.

**Приоритет:** P0 — самый большой бустер для прототипирования, закрывает главный gap.

**Затраты:** 3-5 дней (генераторы SVG + UI выбора + сохранение).

---

### 2. Template Wizard (Мастер шаблонов)

Пошаговая 4-этапная форма для создания шаблона карты.

**Шаги:**
1. **Card Size** — Poker (63×88), Bridge, Tarot, Square + portrait/landscape
2. **Layout** — 6 пресетов (Core, Mystic, Trick, Mire, Arcane, Keep) + blank
3. **Theme** — 5 случайных цветовых тем с procedural art/banner/badge/textbox
4. **Preview + Name** — превью и создание

**Результат:** сгенерированный HTML/CSS шаблон с Handlebars, подстановка `{{size.*}}` и `{{theme.*}}`, сохранение SVG в Asset Library.

**Приоритет:** P1 — улучшает UX начала работы.

**Затраты:** 4-6 дней (шаги, лейауты, генерация темы, сохранение).

---

### 3. Tabletop Simulator Export

Экспорт колоды в формат Tabletop Simulator.

**Параметры:**
- Сетка 10×7 (69 карт на лист)
- Нулевые отступы (margin: 0, gap: 0)
- Максимальное разрешение (4096px по умолчанию)
- Раздельные листы для лицевой и рубашечной сторон
- Выходной формат — ZIP с PNG-листами

**Приоритет:** P1 — высокий community value.

**Затраты:** 2-3 дня (математика сетки, рендер листов, ZIP-упаковка).

---

### 4. Low-Ink Mode (Экономия тонера)

Режим печати без фонов/заливок для экономии тонера/чернил.

**Реализация:**
- Пропс `lowInk: boolean` передаётся в компонент карты
- Шаблон может условно убирать background-image, dark fills, декоративные элементы
- CSS-фильтры или альтернативные стили через Handlebars-условия
- Чекбокс в панели экспорта

**Приоритет:** P2 — полезно для playtest-печати.

**Затраты:** 1 день (пропс + условный рендер + UI).

---

### 5. Simulator: Split by Attribute + Dice/Coins

Расширение функциональности симулятора.

**Split by Attribute:**
- ПКМ на стопке → "Split by Attribute"
- Выбор атрибута (например "Card Type")
- Авто-разделение на стопки по уникальным значениям

**Game Components:**
- Dice (D6) — клик/ПКМ для броска
- Coins — орёл/решка
- Pawns — фишки
- Roll history

**Draw Specific Card:**
- Поиск карты по имени в стопке
- Вытягивание конкретной (не случайной) карты

**Приоритет:** P2 — углубляет playtesting.

**Затраты:** 3-4 дня (split logic, dice roller, search dialog).

---

## Дополнительные фичи (низкий приоритет)

| Фича | Описание | Затраты |
|---|---|---|
| **Deck Analytics** | Статистика колоды: кривая мана-коста, распределение типов, частота ключевых слов | 2-3 дня |
| **Soft-Proof / CMYK Simulation** | Симуляция печатных цветов через ICC-профили (WASM) | 3-4 дня |
| **Export Cache** | Pre-render карт перед батч-экспортом, кеш в памяти | 1-2 дня |
| **Settings Persistence** | Сохранение последних настроек экспорта в localStorage | 0.5 дня |
| **Global Styles / Custom Fonts** | Отдельный CSS-файл для @font-face и глобальных переменных | 1 день |
| **Dropdown Data Columns** | Тип колонки "dropdown" с редактором опций в таблице данных | 1-2 дня |

---

## План реализации

### Фаза 1 (Сейчас — P0)
1. **Asset Generator** — базовые SVG-генераторы + UI
2. **TTS Export** — быстрая победа, решает реальную потребность

### Фаза 2 (Следующая — P1)
3. **Template Wizard** — кардинально улучшает onboarding
4. **Low-Ink Mode** — простой, но частый запрос

### Фаза 3 (Потом — P2)
5. **Simulator Extensions** — split by attribute + dice/coins
6. **Deck Analytics** — статистика колоды

### Фаза 4 (По мере需求 — P3)
7. **Soft-Proof** — профессиональная печать
8. **Dropdown Columns** — удобство редактора данных
9. **Settings Persistence** — мелочь, но приятно
10. **Global Styles / Custom Fonts**

---

## Ссылки

- Cider: https://github.com/oatear/cider
- Cider Docs: https://oatear.github.io/cider-docs/docs/overview/
