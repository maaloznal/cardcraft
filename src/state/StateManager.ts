/**
 * StateManager — centralized application state with sub-structures and selectors.
 * All state changes go through dispatch(). No direct mutation.
 * UI reads state via selectors, not direct field access.
 */

import type { Card, Snapshot, Action } from '../core/types';
import { generateId, deepClone } from '../core/utils';
import {
  DEFAULT_THEME,
  DEFAULT_FORMAT,
  DEFAULT_GRADIENT_ANGLE,
  DEFAULT_LIST_STYLE,
  DEFAULT_PROGRESS_STYLE,
} from '../core/constants';

// ─── Sub-state interfaces ──────────────────────────────────────

export interface CardsState {
  list: Card[];
}

export interface SettingsState {
  theme: string;
  format: string;
  gradientAngle: number;
  showCardNumbers: boolean;
  showProgressBar: boolean;
  progressBarStyle: string;
  listStyleType: string;
  charLimitEnabled: boolean;
}

export interface UIState {
  sidebarOpen: boolean;
  activeCardIndex: number | null;
  colorModalOpen: boolean;
  wordPopupOpen: boolean;
  confirmDialogOpen: boolean;
}

export interface AppState {
  cards: CardsState;
  settings: SettingsState;
  ui: UIState;
}

// ─── Default state factory ─────────────────────────────────────

function createDefaultState(): AppState {
  return {
    cards: { list: [createEmptyCard()] },
    settings: {
      theme: DEFAULT_THEME,
      format: DEFAULT_FORMAT,
      gradientAngle: DEFAULT_GRADIENT_ANGLE,
      showCardNumbers: true,
      showProgressBar: true,
      progressBarStyle: DEFAULT_PROGRESS_STYLE,
      listStyleType: DEFAULT_LIST_STYLE,
      charLimitEnabled: false,
    },
    ui: {
      sidebarOpen: false,
      activeCardIndex: null,
      colorModalOpen: false,
      wordPopupOpen: false,
      confirmDialogOpen: false,
    },
  };
}

// ─── StateManager class ────────────────────────────────────────

type Listener = (state: AppState) => void;

export class StateManager {
  private state: AppState;
  private listeners: Set<Listener> = new Set();

  constructor(initial?: Partial<AppState>) {
    this.state = { ...createDefaultState(), ...initial };
  }

  // ─── Selectors (read-only) ──────────────────────────────────

  /** Get full state — avoid using directly, prefer specific selectors */
  get(): AppState {
    return this.state;
  }

  /** Get all cards */
  getCards(): Card[] {
    return this.state.cards.list;
  }

  /** Get a single card by index */
  getCard(idx: number): Card | null {
    if (idx < 0 || idx >= this.state.cards.list.length) return null;
    return this.state.cards.list[idx];
  }

  /** Get card count */
  getCardCount(): number {
    return this.state.cards.list.length;
  }

  /** Get current global theme */
  getTheme(): string {
    return this.state.settings.theme;
  }

  /** Get current format */
  getFormat(): string {
    return this.state.settings.format;
  }

  /** Get gradient angle */
  getGradientAngle(): number {
    return this.state.settings.gradientAngle;
  }

  /** Get progress bar configuration */
  getProgressConfig(): { show: boolean; style: string } {
    return {
      show: this.state.settings.showProgressBar,
      style: this.state.settings.progressBarStyle,
    };
  }

  /** Get list style */
  getListStyle(): string {
    return this.state.settings.listStyleType;
  }

  /** Get all settings */
  getSettings(): SettingsState {
    return this.state.settings;
  }

  /** Get UI state */
  getUI(): UIState {
    return this.state.ui;
  }

  // ─── Mutations (via dispatch) ───────────────────────────────

  /** Subscribe to state changes */
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Dispatch an action — the only way to mutate state */
  dispatch(action: Action): void {
    const prev = this.state;
    this.state = this.reduce(prev, action);
    if (this.state !== prev) {
      this.listeners.forEach((fn) => fn(this.state));
    }
  }

  /** Replace cards + settings (for undo/redo restore) */
  restore(snapshot: Snapshot): void {
    this.state = {
      ...this.state,
      cards: { list: deepClone(snapshot.cards) },
      settings: {
        ...this.state.settings,
        theme: snapshot.theme,
        format: snapshot.format,
      },
    };
    this.listeners.forEach((fn) => fn(this.state));
  }

  /** Get a snapshot for history */
  snapshot(): Snapshot {
    return {
      cards: deepClone(this.state.cards.list),
      theme: this.state.settings.theme,
      format: this.state.settings.format,
    };
  }

  /** Set cards directly (for import/load) */
  setCards(cards: Card[]): void {
    this.state = {
      ...this.state,
      cards: { list: [...cards] },
    };
    this.listeners.forEach((fn) => fn(this.state));
  }

  // ─── Reducer ────────────────────────────────────────────────

  private reduce(state: AppState, action: Action): AppState {
    switch (action.type) {
      // ── Card operations ──
      case 'ADD_CARD': {
        const card = createEmptyCard();
        return {
          ...state,
          cards: { list: [...state.cards.list, card] },
        };
      }
      case 'DELETE_CARD': {
        const idx = action.payload as number;
        if (state.cards.list.length <= 1 || idx < 0 || idx >= state.cards.list.length) return state;
        const list = [...state.cards.list];
        list.splice(idx, 1);
        return { ...state, cards: { list } };
      }
      case 'DUPLICATE_CARD': {
        const idx = action.payload as number;
        if (idx < 0 || idx >= state.cards.list.length) return state;
        const copy = deepClone(state.cards.list[idx]);
        copy.id = generateId();
        const list = [...state.cards.list];
        list.splice(idx + 1, 0, copy);
        return { ...state, cards: { list } };
      }
      case 'MOVE_CARD': {
        const { idx, dir } = action.payload as { idx: number; dir: number };
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= state.cards.list.length) return state;
        const list = [...state.cards.list];
        [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
        return { ...state, cards: { list } };
      }
      case 'UPDATE_CARD_FIELD': {
        const { idx, field, value } = action.payload as { idx: number; field: keyof Card; value: string };
        if (idx < 0 || idx >= state.cards.list.length) return state;
        const list = [...state.cards.list];
        list[idx] = { ...list[idx], [field]: value };
        return { ...state, cards: { list } };
      }
      case 'SET_CARD_THEME': {
        const { idx, theme } = action.payload as { idx: number; theme: string | undefined };
        if (idx < 0 || idx >= state.cards.list.length) return state;
        const list = [...state.cards.list];
        list[idx] = { ...list[idx], theme };
        return { ...state, cards: { list } };
      }
      case 'SET_CARD_COLORS': {
        const { idx, colors } = action.payload as { idx: number; colors: Record<string, string> };
        if (idx < 0 || idx >= state.cards.list.length) return state;
        const list = [...state.cards.list];
        list[idx] = { ...list[idx], colors: { ...colors } };
        return { ...state, cards: { list } };
      }
      case 'SET_CARD_COLOR': {
        const { idx, key, value } = action.payload as { idx: number; key: string; value: string };
        if (idx < 0 || idx >= state.cards.list.length) return state;
        const card = state.cards.list[idx];
        const newColors = { ...card.colors, [key]: value };
        const list = [...state.cards.list];
        list[idx] = { ...card, colors: newColors };
        return { ...state, cards: { list } };
      }
      case 'DELETE_CARD_COLOR': {
        const { idx, key } = action.payload as { idx: number; key: string };
        if (idx < 0 || idx >= state.cards.list.length) return state;
        const card = state.cards.list[idx];
        if (!card.colors || !(key in card.colors)) return state;
        const newColors = { ...card.colors };
        delete newColors[key];
        const list = [...state.cards.list];
        list[idx] = { ...card, colors: newColors };
        return { ...state, cards: { list } };
      }
      case 'SET_CARD_SECTION_STYLES': {
        const { idx, sectionStyles } = action.payload as {
          idx: number;
          sectionStyles: Record<string, import('../core/types').SectionStyle>;
        };
        if (idx < 0 || idx >= state.cards.list.length) return state;
        const list = [...state.cards.list];
        list[idx] = { ...list[idx], sectionStyles: { ...sectionStyles } };
        return { ...state, cards: { list } };
      }
      case 'UPDATE_CARD_SECTION_STYLE': {
        const { idx, field, style } = action.payload as {
          idx: number;
          field: string;
          style: Partial<import('../core/types').SectionStyle>;
        };
        if (idx < 0 || idx >= state.cards.list.length) return state;
        const card = state.cards.list[idx];
        const existing = card.sectionStyles?.[field] ?? {};
        const newSectionStyles = {
          ...card.sectionStyles,
          [field]: { ...existing, ...style },
        };
        const list = [...state.cards.list];
        list[idx] = { ...card, sectionStyles: newSectionStyles };
        return { ...state, cards: { list } };
      }
      case 'SET_CARD_WORD_STYLES': {
        const { idx, wordStyles } = action.payload as {
          idx: number;
          wordStyles: Record<string, import('../core/types').WordStyle>;
        };
        if (idx < 0 || idx >= state.cards.list.length) return state;
        const list = [...state.cards.list];
        list[idx] = { ...list[idx], wordStyles: { ...wordStyles } };
        return { ...state, cards: { list } };
      }
      case 'DELETE_CARD_WORD_STYLE': {
        const { idx, key } = action.payload as { idx: number; key: string };
        if (idx < 0 || idx >= state.cards.list.length) return state;
        const card = state.cards.list[idx];
        if (!card.wordStyles || !(key in card.wordStyles)) return state;
        const newWordStyles = { ...card.wordStyles };
        delete newWordStyles[key];
        const list = [...state.cards.list];
        list[idx] = { ...card, wordStyles: newWordStyles };
        return { ...state, cards: { list } };
      }
      case 'RESTORE_SNAPSHOT': {
        const snap = action.payload as Snapshot;
        return {
          ...state,
          cards: { list: deepClone(snap.cards) },
          settings: {
            ...state.settings,
            theme: snap.theme,
            format: snap.format,
          },
        };
      }
      case 'CLEAR_ALL':
        return { ...state, cards: { list: [createEmptyCard()] } };

      // ── Settings ──
      case 'SET_GLOBAL_THEME':
        return { ...state, settings: { ...state.settings, theme: action.payload as string } };
      case 'SET_FORMAT':
        return { ...state, settings: { ...state.settings, format: action.payload as string } };
      case 'SET_GRADIENT_ANGLE':
        return { ...state, settings: { ...state.settings, gradientAngle: action.payload as number } };
      case 'SET_SHOW_CARD_NUMBERS':
        return { ...state, settings: { ...state.settings, showCardNumbers: action.payload as boolean } };
      case 'SET_SHOW_PROGRESS_BAR':
        return { ...state, settings: { ...state.settings, showProgressBar: action.payload as boolean } };
      case 'SET_PROGRESS_BAR_STYLE':
        return { ...state, settings: { ...state.settings, progressBarStyle: action.payload as string } };
      case 'SET_LIST_STYLE':
        return { ...state, settings: { ...state.settings, listStyleType: action.payload as string } };
      case 'SET_CHAR_LIMIT':
        return { ...state, settings: { ...state.settings, charLimitEnabled: action.payload as boolean } };

      default:
        return state;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function createEmptyCard(): Card {
  return {
    id: generateId(),
    title: '',
    subtitle: '',
    text: '',
    listItems: '',
    footer: '',
    cta: '',
    colors: {},
    wordStyles: {},
    sectionStyles: {},
  };
}
