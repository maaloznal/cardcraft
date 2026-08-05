/**
 * ExportController — handles PNG download, clipboard copy, and batch export.
 *
 * Extracted from CardCraftApp.ts to reduce orchestrator size.
 * Receives all dependencies via OrchestratorContext.
 */

import * as Export from '@/export/ExportManager';
import { withExportMode } from './export-mode';
import type { OrchestratorContext } from './context';

/** Download a single card as PNG. */
export async function generateAndDownloadPng(
  ctx: OrchestratorContext,
  node: HTMLElement,
  filename: string,
): Promise<void> {
  const { dom, showToast } = ctx;
  const root = dom.root;
  try {
    await withExportMode(root, node, (n) => Export.downloadPng(n, filename, root));
    showToast('Карточка успешно скачана!');
  } catch {
    showToast('Ошибка при скачивании');
  }
}

/** Copy a card to clipboard as PNG. Falls back to download if unavailable. */
export async function copyCardToClipboard(
  ctx: OrchestratorContext,
  node: HTMLElement,
): Promise<void> {
  const { dom, showToast } = ctx;
  const root = dom.root;
  try {
    if (!window.isSecureContext) {
      showToast('Копирование требует HTTPS. Скачиваю PNG вместо копирования…');
      await generateAndDownloadPng(ctx, node, 'card-copy.png');
      return;
    }
    const result = await withExportMode(root, node, (n) => Export.copyToClipboard(n, root));
    if (result.success) {
      showToast('Карточка скопирована в буфер!');
      return;
    }
    if (result.fallback) {
      showToast('Буфер обмена недоступен. Скачиваю PNG…');
      await generateAndDownloadPng(ctx, node, 'card-copy.png');
    }
  } catch {
    showToast('Копирование не удалось. Скачиваю PNG…');
    try {
      await generateAndDownloadPng(ctx, node, 'card-copy.png');
    } catch {
      /* already toasted */
    }
  }
}

/** Download all cards as PNGs sequentially. Shows progress via long toasts. */
export async function downloadAllPng(ctx: OrchestratorContext): Promise<void> {
  const { dom, stateManager, showToast } = ctx;
  const root = dom.root;
  const cards = stateManager.getCards();
  const total = cards.length;
  showToast(`Генерация PNG: 0 из ${total}...`, 60000);
  for (let i = 0; i < total; i++) {
    const node = document.getElementById(`card-node-${cards[i].id}`);
    if (node) {
      try {
        await withExportMode(root, node, (n) => Export.downloadPng(n, `card-${i + 1}.png`, root));
      } catch {
        /* ignore — continue batch */
      }
      showToast(`Скачано ${i + 1} из ${total}...`, 60000);
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  showToast(`Готово! Скачано ${total} из ${total} карточек.`);
}
