# Cardcraft — Architecture Dependency Graph

## Layer Overview

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                         │
│  page.tsx (React shell)                             │
│  card-constructor.ts (orchestrator — to be migrated)│
│  src/ui/ (Accordion, Modal, Switch — planned)       │
└──────────────────────┬──────────────────────────────┘
                       │ reads/writes via
┌──────────────────────▼──────────────────────────────┐
│                 Rendering Layer                      │
│  src/preview/PreviewRenderer (planned)               │
│  src/editor/EditorRenderer (planned)                 │
│  src/word-editor/WordEditorManager (planned)         │
└──────────────────────┬──────────────────────────────┘
                       │ dispatches actions to
┌──────────────────────▼──────────────────────────────┐
│                  State Layer                         │
│  src/state/StateManager.ts                           │
│  src/history/HistoryManager.ts (generic)             │
└──────────────────────┬──────────────────────────────┘
                       │ persists via / applies via
┌──────────────────────▼──────────────────────────────┐
│              Infrastructure Layer                    │
│  src/storage/StorageManager.ts                       │
│  src/themes/ThemeManager.ts + themeData.ts           │
│  src/export/ExportManager.ts                         │
│  src/styles/StyleHelpers.ts                          │
└──────────────────────┬──────────────────────────────┘
                       │ uses
┌──────────────────────▼──────────────────────────────┐
│                   Core Layer                         │
│  src/core/types.ts                                   │
│  src/core/constants.ts                               │
│  src/core/utils.ts                                   │
└─────────────────────────────────────────────────────┘
```

## Dependency Rules

**Critical rule: lower layers must NOT import from upper layers.**

| Layer | Can import from | Cannot import from |
|---|---|---|
| Core | (nothing — self-contained) | Everything above |
| Infrastructure | Core | State, Rendering, UI |
| State | Core, Infrastructure | Rendering, UI |
| Rendering | Core, State, Infrastructure | UI |
| UI | All layers below | (none above — top layer) |

## Module Responsibilities

### Core Layer
- **types.ts** — All TypeScript interfaces. No runtime code.
- **constants.ts** — All magic numbers, field configs, preset colors. No functions.
- **utils.ts** — Pure functions (escapeHtml, generateId, deepClone, isWordChar). No DOM, no state.

### Infrastructure Layer
- **StorageManager.ts** — Only module with localStorage access. `save()`, `load()`, `clear()`, `migrateCard()`.
- **ThemeManager.ts** — Theme lookup, resolution, application. `getThemeLabel()`, `resolveCardTheme()`, `isNoBgTheme()`.
- **themeData.ts** — Static data: 90 themes in 4 groups. No functions.
- **ExportManager.ts** — Only module with html-to-image. `generatePng()`, `downloadPng()`, `copyToClipboard()`.
- **StyleHelpers.ts** — Pure style building: `buildSectionStyle()`, `applyWordStylesToText()`, `pruneOrphanWordStyles()`.

### State Layer
- **StateManager.ts** — Centralized state with sub-structures (cards, settings, ui). Dispatch/action system. Selectors for read access. `subscribe()` for reactive updates.
- **HistoryManager.ts** — Generic `<T>` undo/redo stack. Debounced snapshots. Not tied to any specific state shape.

### Rendering Layer (planned)
- **PreviewRenderer.ts** — Renders card preview. `render()`, `updateCard()`, `removeCard()`, `insertCard()`.
- **EditorRenderer.ts** — Renders editor blocks. Event delegation. Accordion management.
- **WordEditorManager.ts** — Word popup, drag, selection, style application.

### UI Layer (planned)
- **page.tsx** — React shell (static JSX, one-time render).
- **card-constructor.ts** — Orchestrator: wires UI events to StateManager dispatch, subscribes to state changes, triggers re-renders.
- **src/ui/** — Reusable UI components: Accordion, Modal, Switch, Dropdown, etc.

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

## Data Flow

```
User interaction (click, type, drag)
  ↓
Orchestrator (card-constructor.ts)
  ↓ dispatch(Action)
StateManager.reduce()
  ↓ new AppState
Listeners notified
  ↓
PreviewRenderer.updateCard(cardId, changes)  ← O(1) targeted update
EditorRenderer.updateBlock(cardId, changes)  ← O(1) targeted update
  ↓
StorageManager.save(partialState)  ← debounced 400ms
HistoryManager.schedulePush(snapshot)  ← debounced 700ms
```
