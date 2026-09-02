/**
 * KeyboardController — binds keyboard shortcuts and document-level keydown.
 *
 * Extracted from CardCraftApp.ts to reduce orchestrator size.
 * Handles:
 *   - Escape priority chain: themeDropdown → modalCardThemeDropdown → wordPopup → colorModal
 *   - Ctrl+S: save
 *   - Ctrl+Z: undo
 *   - Ctrl+Y / Ctrl+Shift+Z: redo
 *   - Document click: close word popup on outside click (5-condition check)
 */

import type { OrchestratorContext } from './context';

/** Bind keyboard shortcuts and document-level click handler.
 *  Returns cleanup function that removes the listeners. */
export function bindKeyboardAndDocHandlers(ctx: OrchestratorContext): void {
  const { dom, listeners } = ctx;
  const { themeDropdown, modalCardThemeDropdown, wordStylePopup, colorModal, editorSidebar } = dom;

  // Document-level click: close word popup (5-condition check)
  listeners.addDoc('click', (e) => {
    const t = e.target as HTMLElement;
    if (!wordStylePopup?.classList.contains('active')) return;
    if (wordStylePopup.contains(t)) return;
    if (editorSidebar?.contains(t)) return;
    if (colorModal?.contains(t)) return;
    if (t.closest('.cc-styled-word')) return;
    if (t.closest('input, textarea, select, button')) return;
    ctx.closeWordStylePopup();
  });

  // Document-level keydown: Escape priority + Ctrl shortcuts
  listeners.addDoc('keydown', (e) => {
    if (e.key === 'Escape') {
      // Priority: themeDropdown → modalCardThemeDropdown → wordStylePopup → colorModal
      if (themeDropdown?.classList.contains('open')) {
        // Handled by Dropdown class if closeOnEscape is true, but we set it false
        // so the orchestrator manages priority centrally.
      } else if (modalCardThemeDropdown?.classList.contains('open')) {
        // Same — Dropdown class has closeOnEscape: false
      } else if (wordStylePopup?.classList.contains('active')) {
        ctx.closeWordStylePopup();
      } else if (colorModal?.classList.contains('active')) {
        ctx.closeColorModal();
      }
    }
    const mod = e.ctrlKey || e.metaKey;
    if (mod && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      ctx.saveNow({ silent: false });
    } else if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      ctx.undo();
    } else if (mod && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault();
      ctx.redo();
    } else if (mod && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      ctx.redo();
    }
  });
}

/** Save handler for beforeunload event (synchronous, no debounce). */
export function createSaveOnUnload(ctx: OrchestratorContext): () => void {
  return () => ctx.saveNow({ silent: true });
}
