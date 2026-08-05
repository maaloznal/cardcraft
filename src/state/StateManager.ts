/**
 * StateManager — centralized application state.
 * All state changes go through dispatch(). No direct mutation.
 */

import type { Card, Snapshot, Action, WordStyle, SectionStyle } from '../core/types';
import { generateId, deepClone } from '../core/utils';
import { DEFAULT_THEME, DEFAULT_FORMAT, DEFAULT_GRADIENT_ANGLE, DEFAULT_LIST_STYLE, DEFAULT_PROGRESS_STYLE } from '../core/constants';

export interface AppState {
  cards: Card[];
  currentTheme: string;
  currentFormat: string;
  gradientAngle: number;
  showCardNumbers: boolean;
  showProgressBar: boolean;
  progressBarStyle: string;
  listStyleType: string;
  charLimitEnabled: boolean;
}

type Listener = (state: AppState) => void;

export class StateManager {
  private state: AppState;
  private listeners: Set<Listener> = new Set();

  constructor(initial?: Partial<AppState>) {
    this.state = {
      cards: [createEmptyCard()],
      currentTheme: DEFAULT_THEME,
      currentFormat: DEFAULT_FORMAT,
      gradientAngle: DEFAULT_GRADIENT_ANGLE,
      showCardNumbers: true,
      showProgressBar: true,
      progressBarStyle: DEFAULT_PROGRESS_STYLE,
      listStyleType: DEFAULT_LIST_STYLE,
      charLimitEnabled: false,
      ...initial,
    };
  }

  /** Get current state (read-only) */
  get(): AppState {
    return this.state;
  }

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

  /** Replace entire state (for undo/redo restore) */
  restore(snapshot: Snapshot): void {
    this.state = {
      ...this.state,
      cards: deepClone(snapshot.cards),
      currentTheme: snapshot.theme,
      currentFormat: snapshot.format,
    };
    this.listeners.forEach((fn) => fn(this.state));
  }

  /** Get a snapshot for history */
  snapshot(): Snapshot {
    return {
      cards: deepClone(this.state.cards),
      theme: this.state.currentTheme,
      format: this.state.currentFormat,
    };
  }

  /** Set cards directly (for import/load) */
  setCards(cards: Card[]): void {
    this.state = { ...this.state, cards: [...cards] };
    this.listeners.forEach((fn) => fn(this.state));
  }

  /** Reducer — pure function that computes next state */
  private reduce(state: AppState, action: Action): AppState {
    switch (action.type) {
      case 'ADD_CARD': {
        const card = createEmptyCard();
        return { ...state, cards: [...state.cards, card] };
      }
      case 'DELETE_CARD': {
        const idx = action.payload as number;
        if (state.cards.length <= 1 || idx < 0 || idx >= state.cards.length) return state;
        const cards = [...state.cards];
        cards.splice(idx, 1);
        return { ...state, cards };
      }
      case 'DUPLICATE_CARD': {
        const idx = action.payload as number;
        if (idx < 0 || idx >= state.cards.length) return state;
        const copy = deepClone(state.cards[idx]);
        copy.id = generateId();
        const cards = [...state.cards];
        cards.splice(idx + 1, 0, copy);
        return { ...state, cards };
      }
      case 'MOVE_CARD': {
        const { idx, dir } = action.payload as { idx: number; dir: number };
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= state.cards.length) return state;
        const cards = [...state.cards];
        [cards[idx], cards[newIdx]] = [cards[newIdx], cards[idx]];
        return { ...state, cards };
      }
      case 'UPDATE_CARD_FIELD': {
        const { idx, field, value } = action.payload as { idx: number; field: keyof Card; value: string };
        if (idx < 0 || idx >= state.cards.length) return state;
        const cards = [...state.cards];
        cards[idx] = { ...cards[idx], [field]: value };
        return { ...state, cards };
      }
      case 'SET_CARD_THEME': {
        const { idx, theme } = action.payload as { idx: number; theme: string | undefined };
        if (idx < 0 || idx >= state.cards.length) return state;
        const cards = [...state.cards];
        cards[idx] = { ...cards[idx], theme };
        return { ...state, cards };
      }
      case 'SET_GLOBAL_THEME':
        return { ...state, currentTheme: action.payload as string };
      case 'SET_FORMAT':
        return { ...state, currentFormat: action.payload as string };
      case 'SET_GRADIENT_ANGLE':
        return { ...state, gradientAngle: action.payload as number };
      case 'SET_SHOW_CARD_NUMBERS':
        return { ...state, showCardNumbers: action.payload as boolean };
      case 'SET_SHOW_PROGRESS_BAR':
        return { ...state, showProgressBar: action.payload as boolean };
      case 'SET_PROGRESS_BAR_STYLE':
        return { ...state, progressBarStyle: action.payload as string };
      case 'SET_LIST_STYLE':
        return { ...state, listStyleType: action.payload as string };
      case 'SET_CHAR_LIMIT':
        return { ...state, charLimitEnabled: action.payload as boolean };
      case 'CLEAR_ALL':
        return { ...state, cards: [createEmptyCard()] };
      default:
        return state;
    }
  }
}

/** Create a new empty card */
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
