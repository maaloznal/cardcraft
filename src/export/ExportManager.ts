/**
 * ExportManager — handles PNG export and clipboard copy.
 * Only module that interacts with html-to-image.
 *
 * Bundle optimization: html-to-image is dynamically imported only when
 * the user actually triggers an export (download/copy). This keeps the
 * initial page load fast — html-to-image (~520KB) is not in the main chunk.
 */

import { CONFIG } from '../core/constants';

const EXPORT_PIXEL_RATIO = CONFIG.EXPORT_PIXEL_RATIO;

/** Lazily load html-to-image only when needed. */
async function loadHtmlToImage(): Promise<{
  toPng: typeof import('html-to-image').toPng;
  toBlob: typeof import('html-to-image').toBlob;
}> {
  const mod = await import('html-to-image');
  return { toPng: mod.toPng, toBlob: mod.toBlob };
}

/** Generate a PNG data URL from a DOM node */
export async function generatePng(
  node: HTMLElement,
  root: HTMLElement,
): Promise<string> {
  root.classList.add('exporting');
  try {
    await document.fonts.ready;
    const { toPng } = await loadHtmlToImage();
    return await toPng(node, {
      pixelRatio: EXPORT_PIXEL_RATIO,
      cacheBust: true,
    });
  } finally {
    root.classList.remove('exporting');
  }
}

/** Generate a PNG blob from a DOM node (for clipboard) */
export async function generateBlob(
  node: HTMLElement,
  root: HTMLElement,
): Promise<Blob | null> {
  root.classList.add('exporting');
  try {
    await document.fonts.ready;
    const { toBlob } = await loadHtmlToImage();
    return await toBlob(node, {
      pixelRatio: EXPORT_PIXEL_RATIO,
      cacheBust: true,
    });
  } finally {
    root.classList.remove('exporting');
  }
}

/** Download a node as PNG file */
export async function downloadPng(
  node: HTMLElement,
  filename: string,
  root: HTMLElement,
): Promise<void> {
  const dataUrl = await generatePng(node, root);
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/** Copy a node as PNG to clipboard (with fallback to download) */
export async function copyToClipboard(
  node: HTMLElement,
  root: HTMLElement,
): Promise<{ success: boolean; fallback: boolean }> {
  if (!window.isSecureContext) {
    return { success: false, fallback: true };
  }
  const blob = await generateBlob(node, root);
  if (!blob) return { success: false, fallback: true };
  if (!navigator.clipboard || !window.ClipboardItem) {
    return { success: false, fallback: true };
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return { success: true, fallback: false };
  } catch {
    return { success: false, fallback: true };
  }
}
