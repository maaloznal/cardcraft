/**
 * UiAppliers — functions that apply state changes to DOM UI controls.
 *
 * Extracted from CardCraftApp.ts to reduce orchestrator size.
 * These functions sync DOM elements (selects, toggles, sliders, classes)
 * to match the current StateManager state. They are idempotent — safe
 * to call on every state change.
 */

import { EDITOR_FIELDS, FORMAT_CHAR_LIMITS } from '@/core/constants';
import { THEME_GROUPS } from '@/themes/themeData';
import type { OrchestratorContext } from './context';

/** Apply theme to workspace: set data-theme attr + sync dropdown label. */
export function applyThemeToWorkspace(ctx: OrchestratorContext): void {
  const { dom, stateManager } = ctx;
  if (!dom.previewWorkspace) return;
  const theme = stateManager.getTheme();
  if (theme !== 'default') {
    dom.previewWorkspace.setAttribute('data-theme', theme);
  } else {
    dom.previewWorkspace.removeAttribute('data-theme');
  }
  syncThemeDropdown(ctx);
}

/** Apply gradient angle: set CSS variable on workspace. */
export function applyGradientAngle(ctx: OrchestratorContext): void {
  const { dom, stateManager } = ctx;
  if (!dom.previewWorkspace) return;
  const angle = stateManager.getGradientAngle();
  dom.previewWorkspace.style.setProperty('--gradient-angle', `${angle}deg`);
}

/** Toggle .no-card-numbers class on root. */
export function applyNumberingVisibility(ctx: OrchestratorContext): void {
  const { dom, stateManager } = ctx;
  dom.root.classList.toggle('no-card-numbers', !stateManager.getSettings().showCardNumbers);
}

/** Toggle .no-progress-bar class on root. */
export function applyProgressBarVisibility(ctx: OrchestratorContext): void {
  const { dom, stateManager } = ctx;
  dom.root.classList.toggle('no-progress-bar', !stateManager.getSettings().showProgressBar);
}

/** Set data-progress-style attribute on root. */
export function applyProgressBarStyle(ctx: OrchestratorContext): void {
  const { dom, stateManager } = ctx;
  dom.root.setAttribute('data-progress-style', stateManager.getSettings().progressBarStyle);
}

/** Set data-list-style attribute on root. */
export function applyListStyle(ctx: OrchestratorContext): void {
  const { dom, stateManager } = ctx;
  dom.root.setAttribute('data-list-style', stateManager.getSettings().listStyleType);
}

/** Apply char limit: set maxlength on editor inputs, toggle char counter visibility. */
export function applyCharLimit(ctx: OrchestratorContext): void {
  const { dom, stateManager } = ctx;
  const format = stateManager.getFormat();
  const enabled = stateManager.getSettings().charLimitEnabled;
  const limit = FORMAT_CHAR_LIMITS[format] || 0;
  dom.root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[data-field], textarea[data-field]').forEach((el) => {
    const field = el.dataset.field;
    const cfg = EDITOR_FIELDS.find((f) => f.key === field);
    if (limit > 0 && enabled) {
      el.setAttribute('maxlength', String(Math.min(limit, cfg?.maxlength ?? limit)));
    } else if (cfg) {
      el.setAttribute('maxlength', String(cfg.maxlength));
    }
  });
  if (dom.charCounter) {
    dom.charCounter.style.display = enabled && limit > 0 ? '' : 'none';
  }
}

/** Update char counter text for a card. */
export function updateCharCounter(ctx: OrchestratorContext, idx: number): void {
  const { dom, stateManager } = ctx;
  const card = stateManager.getCard(idx);
  if (!card) return;
  const format = stateManager.getFormat();
  const limit = FORMAT_CHAR_LIMITS[format] || 0;
  if (!limit) return;
  const total = (
    card.title +
    card.subtitle +
    card.text +
    card.listItems +
    card.footer +
    card.cta
  ).length;
  if (dom.charCounterText) {
    dom.charCounterText.textContent = `${total} / ${limit}`;
  }
  if (dom.charCounter) {
    dom.charCounter.classList.toggle('near-limit', total >= limit * 0.9);
  }
}

/** Sync theme dropdown label and .selected class on items. */
function syncThemeDropdown(ctx: OrchestratorContext): void {
  const { dom, stateManager } = ctx;
  const theme = stateManager.getTheme();
  // Find label for current theme
  let label = theme;
  for (const group of THEME_GROUPS) {
    const found = group.themes.find((t) => t.value === theme);
    if (found) {
      label = found.label;
      break;
    }
  }
  if (dom.themeDropdownLabel) dom.themeDropdownLabel.textContent = label;
  // Update .selected class on theme items
  dom.root.querySelectorAll<HTMLElement>('.theme-item').forEach((item) => {
    item.classList.toggle('selected', item.dataset.value === theme);
  });
}

/** Update card count badge text. */
export function updateCardCountBadge(ctx: OrchestratorContext): void {
  const { dom, stateManager } = ctx;
  if (!dom.cardCountBadge) return;
  const n = stateManager.getCardCount();
  if (n === 0) {
    dom.cardCountBadge.style.display = 'none';
    return;
  }
  dom.cardCountBadge.style.display = '';
  const word = n === 1 ? 'карточка' : n <= 4 ? 'карточки' : 'карточек';
  dom.cardCountBadge.textContent = `${n} ${word}`;
}

/** Update undo/redo button disabled state. */
export function updateUndoRedoButtons(ctx: OrchestratorContext): void {
  const { dom, historyManager } = ctx;
  if (dom.undoBtn) dom.undoBtn.disabled = !historyManager.canUndo;
  if (dom.redoBtn) dom.redoBtn.disabled = !historyManager.canRedo;
}

/** Run all UI appliers at once (used by state subscriber). */
export function applyAllUi(ctx: OrchestratorContext): void {
  applyThemeToWorkspace(ctx);
  applyGradientAngle(ctx);
  applyNumberingVisibility(ctx);
  applyProgressBarVisibility(ctx);
  applyProgressBarStyle(ctx);
  applyListStyle(ctx);
  applyCharLimit(ctx);
  updateUndoRedoButtons(ctx);
}
