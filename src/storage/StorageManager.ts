/**
 * StorageManager — single module that owns all localStorage access.
 * No other code in the project should call localStorage directly.
 *
 * All data loaded from localStorage is treated as untrusted and sanitized
 * via the validation module before being returned to callers.
 */

import type { Card } from '../core/types';
import {
  sanitizeCards,
  sanitizeTheme,
  sanitizeFormat,
  sanitizeProgressStyle,
  sanitizeListStyle,
} from '../core/validation';

const KEYS = {
  CARDS: 'flashcard-cards',
  THEME: 'flashcard-theme',
  FORMAT: 'flashcard-format',
  SHOW_NUMBERS: 'flashcard-show-numbers',
  SHOW_PROGRESS: 'flashcard-show-progress',
  PROGRESS_STYLE: 'flashcard-progress-style',
  LIST_STYLE: 'flashcard-list-style',
  GRADIENT_ANGLE: 'flashcard-gradient-angle',
  CHAR_LIMIT: 'flashcard-char-limit',
  SIDEBAR_WIDTH: 'flashcard-sidebar-width',
  HEADER_HEIGHT: 'flashcard-header-height',
} as const;

export interface SavedState {
  cards: Card[];
  theme: string;
  format: string;
  showCardNumbers: boolean;
  showProgressBar: boolean;
  progressBarStyle: string;
  listStyleType: string;
  gradientAngle: number;
  charLimitEnabled: boolean;
  sidebarWidth: number | null;
  headerHeight: number | null;
}

export function save(state: Partial<SavedState>): void {
  try {
    if (state.cards !== undefined) {
      // Strip empty objects before saving to save space
      const cleaned = state.cards.map((c) => {
        const out: Record<string, unknown> = { ...c };
        if (out.wordStyles && Object.keys(out.wordStyles as object).length === 0) delete out.wordStyles;
        if (out.sectionStyles && Object.keys(out.sectionStyles as object).length === 0) delete out.sectionStyles;
        if (out.colors && Object.keys(out.colors as object).length === 0) delete out.colors;
        if (!out.theme) delete out.theme;
        return out;
      });
      localStorage.setItem(KEYS.CARDS, JSON.stringify(cleaned));
    }
    if (state.theme !== undefined) localStorage.setItem(KEYS.THEME, state.theme);
    if (state.format !== undefined) localStorage.setItem(KEYS.FORMAT, state.format);
    if (state.showCardNumbers !== undefined) localStorage.setItem(KEYS.SHOW_NUMBERS, String(state.showCardNumbers));
    if (state.showProgressBar !== undefined) localStorage.setItem(KEYS.SHOW_PROGRESS, String(state.showProgressBar));
    if (state.progressBarStyle !== undefined) localStorage.setItem(KEYS.PROGRESS_STYLE, state.progressBarStyle);
    if (state.listStyleType !== undefined) localStorage.setItem(KEYS.LIST_STYLE, state.listStyleType);
    if (state.gradientAngle !== undefined) localStorage.setItem(KEYS.GRADIENT_ANGLE, String(state.gradientAngle));
    if (state.charLimitEnabled !== undefined) localStorage.setItem(KEYS.CHAR_LIMIT, String(state.charLimitEnabled));
    if (state.sidebarWidth !== undefined && state.sidebarWidth !== null) localStorage.setItem(KEYS.SIDEBAR_WIDTH, String(state.sidebarWidth));
    if (state.headerHeight !== undefined && state.headerHeight !== null) localStorage.setItem(KEYS.HEADER_HEIGHT, String(state.headerHeight));
  } catch (e) {
    const err = e as Error;
    if (err.name === 'QuotaExceededError') {
      // Re-throw with context so caller can show toast
      throw new Error(`QuotaExceededError`);
    }
    throw e;
  }
}

export function load(): Partial<SavedState> {
  const result: Partial<SavedState> = {};

  const savedCards = localStorage.getItem(KEYS.CARDS);
  if (savedCards) {
    try {
      const parsed: unknown = JSON.parse(savedCards);
      // Sanitize all card data — treat as untrusted
      const sanitized = sanitizeCards(parsed);
      if (sanitized.length > 0) {
        result.cards = sanitized;
      }
    } catch {
      // Corrupted JSON — clear cards/theme/format keys
      localStorage.removeItem(KEYS.CARDS);
      localStorage.removeItem(KEYS.THEME);
      localStorage.removeItem(KEYS.FORMAT);
    }
  }

  const theme = localStorage.getItem(KEYS.THEME);
  if (theme !== null) result.theme = sanitizeTheme(theme);

  const format = localStorage.getItem(KEYS.FORMAT);
  if (format !== null) result.format = sanitizeFormat(format);

  const showNumbers = localStorage.getItem(KEYS.SHOW_NUMBERS);
  if (showNumbers !== null) result.showCardNumbers = showNumbers === 'true';

  const showProgress = localStorage.getItem(KEYS.SHOW_PROGRESS);
  if (showProgress !== null) result.showProgressBar = showProgress === 'true';

  const progressStyle = localStorage.getItem(KEYS.PROGRESS_STYLE);
  if (progressStyle !== null) result.progressBarStyle = sanitizeProgressStyle(progressStyle);

  const listStyle = localStorage.getItem(KEYS.LIST_STYLE);
  if (listStyle !== null) result.listStyleType = sanitizeListStyle(listStyle);

  const gradientAngle = localStorage.getItem(KEYS.GRADIENT_ANGLE);
  if (gradientAngle) {
    const n = Number(gradientAngle);
    result.gradientAngle = Number.isFinite(n) ? Math.max(0, Math.min(360, Math.round(n))) : 135;
  }

  const charLimit = localStorage.getItem(KEYS.CHAR_LIMIT);
  if (charLimit !== null) result.charLimitEnabled = charLimit === 'true';

  const sidebarWidth = localStorage.getItem(KEYS.SIDEBAR_WIDTH);
  if (sidebarWidth) {
    const n = Number(sidebarWidth);
    if (Number.isFinite(n)) result.sidebarWidth = Math.max(260, Math.min(520, Math.round(n)));
  }

  const headerHeight = localStorage.getItem(KEYS.HEADER_HEIGHT);
  if (headerHeight) {
    const n = Number(headerHeight);
    if (Number.isFinite(n)) result.headerHeight = Math.max(60, Math.min(800, Math.round(n)));
  }

  return result;
}

export function clear(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

/** Save sidebar width directly (called by resizers) */
export function saveSidebarWidth(width: number): void {
  const clamped = Math.max(260, Math.min(520, Math.round(width)));
  localStorage.setItem(KEYS.SIDEBAR_WIDTH, String(clamped));
}

/** Save header height directly (called by resizers) */
export function saveHeaderHeight(height: number): void {
  const clamped = Math.max(60, Math.min(800, Math.round(height)));
  localStorage.setItem(KEYS.HEADER_HEIGHT, String(clamped));
}

/** Load sidebar width (called by resizers) */
export function loadSidebarWidth(): number | null {
  const v = localStorage.getItem(KEYS.SIDEBAR_WIDTH);
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(260, Math.min(520, Math.round(n)));
}

/** Load header height (called by resizers) */
export function loadHeaderHeight(): number | null {
  const v = localStorage.getItem(KEYS.HEADER_HEIGHT);
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(60, Math.min(800, Math.round(n)));
}
