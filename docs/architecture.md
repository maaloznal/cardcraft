# Cardcraft — Architecture

## Layer Overview

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                          │
│  src/app/page.tsx (React shell — static JSX)        │
│  src/components/ErrorBoundary.tsx                   │
└──────────────────────┬──────────────────────────────┘
                       │ calls initCardCraftApp(root)
┌──────────────────────▼──────────────────────────────┐
│                Orchestrator Layer                    │
│  src/orchestrator/CardCraftApp.ts                   │
│  src/orchestrator/toast.ts                          │
│  src/orchestrator/resizers.ts                       │
│  src/orchestrator/export-mode.ts                    │
└──────────────────────┬──────────────────────────────┘
                       │ uses
┌──────────────────────▼──────────────────────────────┐
│              UI Kit (vanilla JS classes)             │
│  src/ui/Accordion.ts (Accordion, SidebarAccordion,  │
│                       ModalAccordion)                │
│  src/ui/Modal.ts (focus trap + ESC + backdrop)      │
│  src/ui/Switch.ts (checkbox + button based)         │
│  src/ui/Dropdown.ts (click-outside + nested groups) │
└──────────────────────┬──────────────────────────────┘
                       │ dispatches actions to / calls
┌──────────────────────▼──────────────────────────────┐
│                 Rendering Layer                      │
│  src/preview/PreviewRenderer.ts (O(1) updates)      │
│  src/editor/EditorRenderer.ts (event delegation)    │
│  src/word-editor/WordEditorManager.ts               │
└──────────────────────┬──────────────────────────────┘
                       │ dispatches actions to
┌──────────────────────▼──────────────────────────────┐
│                  State Layer                         │
│  src/state/StateManager.ts (20 actions, selectors)  │
│  src/history/HistoryManager.ts (generic <T>)        │
└──────────────────────┬──────────────────────────────┘
                       │ persists via / applies via
┌──────────────────────▼──────────────────────────────┐
│              Infrastructure Layer                    │
│  src/storage/StorageManager.ts (validated load)     │
│  src/themes/ThemeManager.ts + themeData.ts          │
│  src/export/ExportManager.ts                        │
│  src/styles/StyleHelpers.ts (CSS-safe sanitization) │
└──────────────────────┬──────────────────────────────┘
                       │ uses
┌──────────────────────▼──────────────────────────────┐
│                   Core Layer                         │
│  src/core/types.ts    src/core/constants.ts         │
│  src/core/utils.ts    src/core/validation.ts        │
└─────────────────────────────────────────────────────┘
```

## Dependency Rules

**Critical rule: lower layers must NOT import from upper layers.**

| Layer | Can import from | Cannot import from |
|---|---|---|
| Core | (nothing — self-contained) | Everything above |
| Infrastructure | Core | State, Rendering, UI, Orchestrator |
| State | Core, Infrastructure | Rendering, UI, Orchestrator |
| Rendering | Core, State, Infrastructure | UI, Orchestrator |
| UI Kit | Core, Infrastructure | State, Rendering, Orchestrator |
| Orchestrator | All layers below | (nothing above) |
| UI Layer | Orchestrator | (none above — top layer) |

## Module Statistics

| Layer | Modules | Lines | Avg module |
|---|---:|---:|---:|
| Core | 4 | 582 | 146 |
| Infrastructure | 5 | 575 | 115 |
| State | 2 | 467 | 234 |
| Rendering | 3 | 993 | 331 |
| UI Kit | 5 | 718 | 144 |
| Orchestrator + helpers | 4 | 1540 | 385 |
| **Total** | **23** | **4875** | **212** |

For comparison: the old God Function was a single 2731-line file.

## Module Responsibilities

### Core Layer
- **types.ts** (105 lines) — All TypeScript interfaces: Card, WordStyle, SectionStyle, Snapshot, Action, ActionType (20 types), ThemeGroup, EditorField, ModalField, FieldConfig. No runtime code.
- **constants.ts** (101 lines) — All magic numbers: CONFIG, DEFAULT_THEME, PRESET_COLORS, FORMAT_CHAR_LIMITS, FIELD_LABELS, EDITOR_FIELDS, MODAL_FIELDS, FIELD_CONFIG, SHAPE_PROGRESS_STYLES, MODAL_GROUPS. No functions.
- **utils.ts** (63 lines) — Pure functions: `escapeHtml`, `generateId`, `deepClone`, `splitOnce`, `isWordChar`, `containsWholeWord`, `stripMeta`. No DOM, no state.
- **validation.ts** (313 lines) — **Security-critical module.** All data from localStorage is treated as untrusted. Provides `sanitizeCard`, `sanitizeCards`, `sanitizeTheme`, `sanitizeFormat`, `sanitizeHexColor`, `clampFontSize`, `escapeAttr`, and whitelist sets (`VALID_THEMES`, `VALID_FORMATS`, `VALID_PROGRESS_STYLES`, `VALID_LIST_STYLES`). Prevents XSS via attribute injection and CSS injection via hex validation.

### Infrastructure Layer
- **StorageManager.ts** (174 lines) — Only module with localStorage access. `save()`, `load()` (with full sanitization via validation module), `clear()`, `saveSidebarWidth()`, `saveHeaderHeight()`, `loadSidebarWidth()`, `loadHeaderHeight()`. Handles quota errors, corrupted JSON recovery. All loaded data is sanitized before returning to callers.
- **themeData.ts** (118 lines) — Static data: 90 themes in 4 groups (Светлые, Тёмные, Градиентные, Без фона). No functions.
- **ExportManager.ts** (77 lines) — Only module with html-to-image. `generatePng()`, `generateBlob()`, `downloadPng()`, `copyToClipboard()`. Handles HTTPS check, clipboard fallback.
- **StyleHelpers.ts** (127 lines) — Pure style building: `buildSectionStyle()`, `buildListNumStyle()`, `applyWordStylesToText()`, `pruneOrphanWordStyles()`. No DOM mutation.

### State Layer
- **StateManager.ts** (337 lines) — Centralized state with sub-structures (cards, settings, ui). Dispatch/action system with 18 action types. 10+ selectors for read access. `subscribe()` returns unsubscribe function. `snapshot()` for history. `restore()` for undo/redo.
- **HistoryManager.ts** (76 lines) — Generic `<T>` undo/redo stack. `push()`, `schedulePush()` (debounced), `undo()`, `redo()`, `init()`, `clear()`. Undo/redo/push all cancel pending debounced pushes to prevent race conditions.

### Rendering Layer
- **PreviewRenderer.ts** (441 lines) — Renders card preview to `#cardsArea`. Full `render()` O(n) + targeted updates: `updateCardField()` O(1), `updateCardStyle()` O(1), `updateCardTheme()` O(1), `removeCard()` O(1), `insertCard()` O(1), `updateProgressBars()` O(n). Event delegation: 2 listeners (click + dblclick) on container.
- **EditorRenderer.ts** (208 lines) — Renders editor blocks to `#editorCardsList`. `render()`, `onAction()`, `updateCardNumber()` O(1), `collapseLastCard()`. Event delegation: 4 listeners (click, input, focusin, paste) on container.
- **WordEditorManager.ts** (323 lines) — Word styling popup. `open()`, `close()`, `renderWordStyleList()`, `onStyleChange()`, `onRemoveWord()`, `onClear()`, `destroy()`. Self-contained drag, format buttons, color presets, size slider.

### UI Kit (vanilla JS imperative controllers)
- **Accordion.ts** (155 lines) — `Accordion` base class with event delegation. `SidebarAccordion` and `ModalAccordion` convenience subclasses. `toggle()`, `expand()`, `collapse()`, `expandAll()`, `collapseAll()`, `setExclusive()`, `destroy()`.
- **Modal.ts** (178 lines) — Modal controller with focus trap, ESC key, backdrop click. `open()`, `close()`, `toggle()`, `onOpen()`, `onClose()`, `destroy()`. Tab cycling within modal.
- **Switch.ts** (125 lines) — Toggle switch (checkbox or button based). `checked` getter/setter, `toggle()`, `onToggle()`, `destroy()`.
- **Dropdown.ts** (211 lines) — Dropdown menu with click-outside, ESC, nested theme groups. `open()`, `close()`, `toggle()`, `setValue()`, `getValue()`, `onSelect()`, `destroy()`.
- **index.ts** (32 lines) — Barrel export.

### Orchestrator Layer
- **CardCraftApp.ts** (1226 lines) — Main orchestrator. `initCardCraftApp(root)` boots the app, returns cleanup function. Wires up all modules: StateManager, HistoryManager, StorageManager, PreviewRenderer, EditorRenderer, WordEditorManager, UI Kit (Accordion, Modal, Dropdown), ToastQueue, VerticalResize, HorizontalResize. Handles all static event bindings, keyboard shortcuts (Ctrl+Z/Y/S, Escape), document-level click/keydown delegation. Re-exports `THEME_GROUPS` for page.tsx static rendering.
- **toast.ts** (49 lines) — `ToastQueue` class with queue, long-toast bypass (≥10s), auto-dismiss. `show()`, `destroy()`.
- **resizers.ts** (179 lines) — `VerticalResize` (sidebar fixed header height) and `HorizontalResize` (sidebar width) classes. Pointer-based drag, min/max clamping, localStorage persistence. `destroy()` for cleanup.
- **export-mode.ts** (21 lines) — `withExportMode(node, fn)` helper. Adds `.exporting` class, awaits `document.fonts.ready`, calls fn, removes class in finally.

### UI Layer
- **page.tsx** (548 lines) — React shell with static JSX. Renders all DOM elements with IDs/selectors. Calls `initCardCraftApp(root)` in `useEffect`, returns cleanup function.
- **layout.tsx** (56 lines) — Root layout. Wraps children in `<ErrorBoundary>`. Loads fonts (Geist, Golos Text, Lora, Manrope, Plus Jakarta Sans).
- **ErrorBoundary.tsx** (148 lines) — React error boundary. Catches render errors, shows friendly fallback with reload button. Persists last error to localStorage.

## State Structure

```typescript
interface AppState {
  cards: {
    list: Card[];           // Array of card data
  };
  settings: {
    theme: string;          // Global theme
    format: string;         // Card format (auto, instagram, etc.)
    gradientAngle: number;  // 0-360
    showCardNumbers: boolean;
    showProgressBar: boolean;
    progressBarStyle: string;
    listStyleType: string;
    charLimitEnabled: boolean;
  };
  ui: {
    sidebarOpen: boolean;
    activeCardIndex: number | null;
    colorModalOpen: boolean;
    wordPopupOpen: boolean;
    confirmDialogOpen: boolean;
  };
}
```

## Action Types (18 total)

```typescript
type ActionType =
  // Card operations
  | 'ADD_CARD' | 'DELETE_CARD' | 'DUPLICATE_CARD' | 'MOVE_CARD'
  | 'UPDATE_CARD_FIELD' | 'SET_CARD_THEME' | 'CLEAR_ALL'
  // Card style operations
  | 'SET_CARD_COLORS' | 'SET_CARD_SECTION_STYLES'
  | 'SET_CARD_WORD_STYLES' | 'DELETE_CARD_WORD_STYLE'
  // Settings
  | 'SET_GLOBAL_THEME' | 'SET_FORMAT' | 'SET_GRADIENT_ANGLE'
  | 'SET_SHOW_CARD_NUMBERS' | 'SET_SHOW_PROGRESS_BAR'
  | 'SET_PROGRESS_BAR_STYLE' | 'SET_LIST_STYLE' | 'SET_CHAR_LIMIT'
  // Restore
  | 'RESTORE_SNAPSHOT';
```

## Data Flow

```
User interaction (click, type, drag)
  ↓
Orchestrator (CardCraftApp.ts)
  ↓ dispatch(Action)
StateManager.reduce()
  ↓ new AppState
StateManager notifies subscribers
  ↓
Orchestrator subscriber syncs UI controls (selects, toggles, sliders)
  ↓
PreviewRenderer.updateCardField(card, field)  ← O(1) targeted update
EditorRenderer.updateCardNumber(index)        ← O(1) targeted update
  ↓
StorageManager.save(state)          ← debounced 400ms
HistoryManager.schedulePush(snapshot) ← debounced 700ms

Undo/Redo path:
  Ctrl+Z → historyManager.undo() (cancels pending push timer)
    → stateManager.restore(snapshot)
    → renderEditor() + renderPreview() (full rebuild)
    → scheduleSave({ silent: true })
```

## Race Condition Prevention

1. **HistoryManager.undo()/redo()/push()** all cancel pending `schedulePush` timer — prevents stale snapshots from being pushed after undo/redo.
2. **HistoryManager.push() at MAX_HISTORY** correctly decrements `histIndex` when shifting oldest entry — prevents `canRedo` from becoming permanently false.
3. **scheduleSave()** always clears existing `saveTimer` before setting new one — only the latest state is saved.
4. **Orchestrator cleanup** calls `unsubscribeState()` to prevent state subscriber leak on React remount.
5. **HistoryManager.clear()** cancels pending timer — prevents stale push after component unmount.
6. **deleteCard() validates index** with `Number.isInteger(idx)` — prevents NaN from deleting the wrong card (NaN was previously passed to splice which treats it as 0).
7. **restore() closes modal/popup** before replacing state — prevents stale `activeCardIndexForColors`/`activeCardIndexForWord` from pointing at wrong cards.

## Cleanup

The orchestrator's cleanup function (returned by `initCardCraftApp`):
- Removes all document-level listeners (tracked via `docListeners` array)
- Removes all element-level listeners (tracked via `elementListeners` array)
- Removes window listeners (beforeunload, error, unhandledrejection)
- Calls `destroy()` on: SidebarAccordion, ModalAccordion, Modal, 2× Dropdown, WordEditorManager (including initControls listeners), VerticalResize, HorizontalResize, ToastQueue (including gap timer)
- Calls `unsubscribeState()` to remove StateManager subscriber
- Clears `saveTimer`
- Calls `historyManager.clear()` (clears history + pending timer)

All `destroy()` methods are now comprehensive:
- **WordEditorManager.destroy()** removes all `initControls()` listeners (format buttons, color presets, accordion sections, size slider, clear button) + drag listeners.
- **ToastQueue.destroy()** clears both main timer and gap timer, removes `show` class.
- **Dropdown.destroy()** cancels pending `requestAnimationFrame` before it can attach a leaked document listener.

PreviewRenderer and EditorRenderer don't need `destroy()` — their event listeners are on container elements (`#cardsArea`, `#editorCardsList`) which are removed from DOM by React, automatically garbage-collecting the listeners.

## Security

### XSS Prevention
- **All localStorage data is untrusted.** `StorageManager.load()` sanitizes every field via `validation.ts` before returning to callers.
- **Card IDs** are validated with `isValidCardId()` (alphanumeric + underscore + hyphen, max 64 chars). Invalid IDs are replaced with generated UUIDs.
- **Themes** are validated against `VALID_THEMES` whitelist (90 themes). Unknown themes fall back to `default`.
- **Formats** are validated against `VALID_FORMATS` whitelist (6 formats). Unknown formats fall back to `auto`.
- **Colors** are validated with `isValidHexColor()` regex (`/^#[0-9a-fA-F]{3,8}$/`). Invalid colors are stripped.
- **Font sizes** are clamped to `[8, 96]` via `clampFontSize()`. List num sizes clamped to `[8, 72]`.
- **Font weights** validated against `{normal, bold}`. Font styles against `{normal, italic}`. Text decorations filtered to `{underline, line-through}`.
- **HTML attributes** in PreviewRenderer are escaped with `escapeAttr()` — prevents attribute breakout (`" onclick="alert(1)`).
- **CSS values** in StyleHelpers are sanitized via hex/enum validation — prevents CSS injection (`red;background:url(evil)`).

### Content Security Policy
`next.config.ts` sets CSP and security headers on all routes:
- `Content-Security-Policy`: `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`, `object-src 'none'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`

### State Contract
**All state mutations go through `StateManager.dispatch()`.** No direct card mutation bypasses the reducer. The orchestrator uses:
- `UPDATE_CARD_FIELD` for typing
- `SET_CARD_COLOR` / `DELETE_CARD_COLOR` for color changes
- `UPDATE_CARD_SECTION_STYLE` for format button toggles and size slider
- `SET_CARD_WORD_STYLES` / `DELETE_CARD_WORD_STYLE` for word styling
- `SET_CARD_THEME` for per-card theme
- `SET_CARD_COLORS` / `SET_CARD_SECTION_STYLES` for full resets

`scheduleHistoryPush()` is called for ALL user-facing mutations (color, swatch, reset, section size, listNum size, format buttons, word styles) — undo works for every change.

## Migration Status

**Migration complete.** The legacy `src/lib/card-constructor.ts` (2731 lines) has been removed. The app now runs exclusively on the new modular orchestrator (`src/orchestrator/CardCraftApp.ts`).

- `page.tsx` imports `initCardCraftApp` from `@/orchestrator/CardCraftApp`
- No feature flag, no fallback path
- Legacy God Function deleted

## Build & Quality

- **TypeScript**: `ignoreBuildErrors: false` — all TS errors fixed, build fails on type errors
- **ESLint**: real rules enabled (only `no-console`, `no-non-null-assertion`, `no-explicit-any` relaxed for pragmatic reasons; all other rules at default severity)
- **React StrictMode**: `reactStrictMode: true` — double-mount safe (all listeners tracked and cleaned up)
- **Dependencies**: 8 production deps (4 fonts + html-to-image + next + react + react-dom), 10 dev deps. Removed 47 unused packages (shadcn/radix kit, prisma, sharp, recharts, z-ai-web-dev-sdk, etc.)
- **Dead code removed**: `src/lib/card-constructor.ts`, `src/components/ui/*` (40 files), `src/hooks/*`, `src/lib/db.ts`, `src/lib/utils.ts`, `src/app/api/`, `prisma/`, `db/`

## Verification

- **Lint**: 0 errors, 0 warnings
- **TypeScript**: 0 errors (`tsc --noEmit` clean)
- **Unit tests**: 232 passing (`bun run test`) — covers StateManager, HistoryManager, StorageManager, utils, StyleHelpers, validation
- **Smoke tests**: 109/109 passing (verified via Agent Browser)
- **StrictMode**: enabled, no double-mount errors in console
- **CSP**: active on all routes
- **Error Boundary**: wraps entire app
