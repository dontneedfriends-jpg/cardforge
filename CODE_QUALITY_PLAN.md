# Code Quality Audit — CardForge

**Date:** 2026-05-12  
**Total findings:** 107 (30 High, 55 Medium, 22 Low)  
**`tsc --noEmit`:** ✅ 0 errors

---

## Critical (High Priority)

### 1. `Record<string, any>` in Core Data Model
| File | Line | Issue |
|------|------|-------|
| `store/canvasStore.ts` | 27 | `props: Record<string, any>` — `CanvasElement` |
| `store/canvasStore.ts` | 42 | `props: Record<string, any>` — `ElementPreset` |
| `store/canvasStore.ts` | 60 | `updateElementProps` propagates `any` |
| `features/template-editor/wysiwyg/PropertiesPanel.tsx` | 74 | `handlePropChange` propagates `any` |
| `shared/utils/parseElementTree.ts` | 86 | `props: Record<string, any>` |

**Fix:** Replace with discriminated union per element type (`TextProps | ImageProps | ShapeProps | ...`)

---

### 2. Giant Components (>500 lines, should be split)
| File | Lines | Suggested split |
|------|-------|----------------|
| `features/template-editor/wysiwyg/Canvas.tsx` | 728 | `CanvasSurface`, `DropHandler`, `KeyboardHandler`, `ElementRenderer` |
| `features/settings/SettingsPage.tsx` | 699 | `GeneralSettings`, `EditorSettings`, `ExportSettings`, `AboutSettings` |
| `shared/components/NavRail.tsx` | 650 | `NavRail`, `DeckList`, `TemplateDialog`, `TtsImportDialog` |
| `features/template-editor/wysiwyg/PropertiesPanel.tsx` | 642 | Per-element sub-panels (strategy pattern) |
| `features/assets/AssetManager.tsx` | 535 | `AssetGrid`, `FolderSidebar`, `ImportDialog` |
| `features/simulator/CardTable.tsx` | 483 | `CardTable`, `CardRenderer`, `DragHandler` |
| `features/welcome/WelcomePage.tsx` | 481 | `WelcomeHero`, `ProjectList`, `ProjectCreator` |
| `features/project/ProjectSidebar.tsx` | 419 | `DeckList`, `DeckCreator`, `TtsImporter` |

---

### 3. Accessibility — Non-interactive divs with onClick
| File | Line | Element | Missing |
|------|------|---------|---------|
| `features/simulator/ContextMenu.tsx` | 56 | overlay `<div>` | `role`, `tabIndex`, `onKeyDown` |
| `features/simulator/ContextMenu.tsx` | 59-71 | menu items (7x) | `role="menuitem"`, `tabIndex`, keyboard |
| `features/simulator/DeckZone.tsx` | 122 | Deck pile | `role="button"`, `tabIndex`, keyboard |
| `features/simulator/DeckZone.tsx` | 138 | Discard pile | same |
| `features/overview/OverviewPage.tsx` | 193 | deck card | keyboard handler |
| `features/template-editor/wysiwyg/Canvas.tsx` | 495-496 | canvas surface | `role="application"`, `tabIndex` |

---

### 4. Debug console.log in Production
| File | Line | Log |
|------|------|-----|
| `store/editorStore.ts` | 104 | `[syncCodeToVisual] START` |
| `store/editorStore.ts` | 107 | `[syncCodeToVisual] Skipped...` |
| `store/editorStore.ts` | 112 | `[syncCodeToVisual] html length:` |
| `store/editorStore.ts` | 118 | `[syncCodeToVisual] HTML empty...` |
| `store/editorStore.ts` | 122 | `[syncCodeToVisual] Parsing with...` |
| `store/editorStore.ts` | 124 | `[syncCodeToVisual] Parsed elements:` |
| `features/assets/AssetManager.tsx` | 288 | `[Import] Importing to folder:` |

**Fix:** Remove or guard behind `if (process.env.NODE_ENV !== 'production')`

---

### 5. Silent catch Blocks
| File | Line | Pattern | Risk |
|------|------|---------|------|
| `App.tsx` | 18 | `.catch(() => {})` — `openProject` | Startup failure invisible |
| `App.tsx` | 24 | `.catch(() => {})` — `loadFontsIntoDocument` | Fonts missing silently |
| `store/editorStore.ts` | 165 | `catch { return false; }` | Corrupt canvas JSON → silent fallback |
| `features/assets/AssetManager.tsx` | 507 | `.catch(() => {})` — OS file open fails | User clicks file, nothing happens |

**Fix:** Add user-facing error messages (MessageBar, toast, or dialog)

---

## Medium Priority

### 6. `as any` Conversions
| File | Line | Code |
|------|------|------|
| `features/settings/SettingsPage.tsx` | 192 | `gridTemplateColumns: '...' as any` |
| `features/assets/AssetPickerDialog.tsx` | 121 | `await invoke(...) as any[]` |

### 7. Untyped Parameters (`: any`)
| File | Line | Parameter |
|------|------|-----------|
| `features/project/ProjectSidebar.tsx` | 103 | `handleSelectDeck = async (deck: any)` → should be `DeckMeta` |
| `shared/components/NavRail.tsx` | 428 | same |
| `features/template-editor/CodeEditor.tsx` | 35 | `handleBeforeMount = (monaco: any)` |
| `features/template-editor/HandlebarsHelper.ts` | 3, 21 | `(monaco: any, model: any, position: any)` |

### 8. Hardcoded Magic Numbers
| File | Line | Value | Context |
|------|------|-------|---------|
| `features/template-editor/wysiwyg/Canvas.tsx` | 206-214 | `180, 100, 80, 40, 150` | Default element sizes |
| `store/canvasStore.ts` | 95 | `50` | `MAX_HISTORY` |
| `features/export/ExportPage.tsx` | 136 | `3000` | iframe print timeout |
| `features/export/exportUtils.ts` | 296 | `100` | TTS CardID offset |

### 9. Duplicated Default Card Size
| File | Line |
|------|------|
| `store/editorStore.ts` | 95 |
| `features/project/ProjectSidebar.tsx` | 241 (and 3 more times) |

Should reference `shared/cardSizes.ts` consistently.

### 10. Missing `aria-label` on Icon Buttons
| File | Line | Element |
|------|------|---------|
| `shared/components/TitleBar.tsx` | 119-128 | Minimize button |
| `shared/components/TitleBar.tsx` | 131-148 | Maximize button |
| `shared/components/TitleBar.tsx` | 150-167 | Close button |

---

## Low Priority
- `catch (e: any)` → `catch (e: unknown)` migration (8 occurrences)
- Magic numbers for layout spacing (acceptable)
- Deeply nested Fluent UI menus (acceptable)
- `cardTemplates.ts` 1804 lines (data file, acceptable)

---

## Stats Summary

| Metric | Count |
|--------|-------|
| `@ts-ignore` / `@ts-expect-error` in src | **0** |
| `as any` | **2** |
| `Record<string, any>` | **9** |
| `: any` type annotations | **21** |
| Empty catch `{}` | **2** |
| Silent `.catch(() => {})` | **6** |
| Debug `console.log` | **7** |
| Components >300 lines | **13** |
| Missing a11y keyboard handlers | **11** |
| Catch-only-log (no user feedback) | **7** |
