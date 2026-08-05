/**
 * SaveLoad — handles localStorage persistence and initial load.
 *
 * Extracted from CardCraftApp.ts to reduce orchestrator size.
 * All data loaded from localStorage is sanitized via StorageManager.
 */

import * as Storage from '@/storage/StorageManager';
import { CONFIG } from '@/core/constants';
import type { OrchestratorContext } from './context';

/** Timer for debounced save. */
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Schedule a debounced save (400ms). Only the latest state is saved. */
export function scheduleSave(ctx: OrchestratorContext, opts: { silent?: boolean } = {}): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveNow(ctx, opts), CONFIG.SAVE_DEBOUNCE_MS);
}

/** Save immediately (synchronous). Shows toast on error (unless silent). */
export function saveNow(ctx: OrchestratorContext, { silent = false } = {}): void {
  const { stateManager, showToast } = ctx;
  try {
    const state = stateManager.get();
    Storage.save({
      cards: state.cards.list,
      theme: state.settings.theme,
      format: state.settings.format,
      showCardNumbers: state.settings.showCardNumbers,
      showProgressBar: state.settings.showProgressBar,
      progressBarStyle: state.settings.progressBarStyle,
      listStyleType: state.settings.listStyleType,
      gradientAngle: state.settings.gradientAngle,
      charLimitEnabled: state.settings.charLimitEnabled,
    });
    if (!silent) showToast('Карточки успешно сохранены!');
  } catch (e) {
    const err = e as Error;
    if (err.message === 'QuotaExceededError') {
      if (!silent) showToast('Недостаточно места. Удалите старые карточки.');
    } else if (!silent) {
      showToast('Ошибка при сохранении карточек');
    }
  }
}

/** Load all state from localStorage and dispatch to StateManager. */
export function loadFromLocalStorage(ctx: OrchestratorContext): void {
  const { stateManager } = ctx;
  const saved = Storage.load();
  if (saved.cards && saved.cards.length) {
    stateManager.setCards(saved.cards);
  }
  if (saved.theme) stateManager.dispatch({ type: 'SET_GLOBAL_THEME', payload: saved.theme });
  if (saved.format) stateManager.dispatch({ type: 'SET_FORMAT', payload: saved.format });
  if (saved.showCardNumbers !== undefined)
    stateManager.dispatch({ type: 'SET_SHOW_CARD_NUMBERS', payload: saved.showCardNumbers });
  if (saved.showProgressBar !== undefined)
    stateManager.dispatch({ type: 'SET_SHOW_PROGRESS_BAR', payload: saved.showProgressBar });
  if (saved.progressBarStyle)
    stateManager.dispatch({ type: 'SET_PROGRESS_BAR_STYLE', payload: saved.progressBarStyle });
  if (saved.listStyleType)
    stateManager.dispatch({ type: 'SET_LIST_STYLE', payload: saved.listStyleType });
  if (saved.gradientAngle !== undefined)
    stateManager.dispatch({ type: 'SET_GRADIENT_ANGLE', payload: saved.gradientAngle });
  if (saved.charLimitEnabled !== undefined)
    stateManager.dispatch({ type: 'SET_CHAR_LIMIT', payload: saved.charLimitEnabled });
}

/** Clear the save timer (called on cleanup). */
export function clearSaveTimer(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
}
