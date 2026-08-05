/**
 * StyleHelpers — pure functions for building inline styles and word styling.
 * No DOM access, no side effects.
 *
 * All CSS values are sanitized via validation module to prevent CSS injection.
 */

import type { Card, WordStyle } from '../core/types';
import { escapeHtml, isWordChar, splitOnce } from '../core/utils';
import {
  sanitizeHexColor,
  sanitizeFontWeight,
  sanitizeFontStyle,
  sanitizeTextDecoration,
  clampFontSize,
  clampListNumSize,
} from '../core/validation';

/** Build inline style string for a section field (color, fontWeight, fontSize, etc.) */
export function buildSectionStyle(card: Card, field: string): string {
  const c = card.colors || {};
  const s = card.sectionStyles || {};
  let styleStr = '';
  const colorHex = sanitizeHexColor(c[field]);
  if (colorHex) styleStr += `color:${colorHex} !important;`;
  const ss = s[field];
  if (ss) {
    const fontSize = clampFontSize(ss.fontSize, 16);
    if (ss.fontSize !== undefined) styleStr += `font-size:${fontSize}px;`;
    const fw = sanitizeFontWeight(ss.fontWeight);
    if (fw) styleStr += `font-weight:${fw};`;
    const fst = sanitizeFontStyle(ss.fontStyle);
    if (fst) styleStr += `font-style:${fst};`;
    const td = sanitizeTextDecoration(ss.textDecoration);
    if (td) styleStr += `text-decoration:${td};`;
  }
  return styleStr ? `style="${styleStr}"` : '';
}

/** Build inline style for list number elements (--num-color, --num-bg, etc.) */
export function buildListNumStyle(card: Card): string {
  const c = card.colors || {};
  const vars: string[] = [];
  const numColor = sanitizeHexColor(c.listNumber);
  if (numColor) vars.push(`--num-color:${numColor}`);
  const numBg = sanitizeHexColor(c.listNumBg);
  if (numBg) vars.push(`--num-bg:${numBg}`);
  const numBorder = sanitizeHexColor(c.listNumBorder);
  if (numBorder) vars.push(`--num-border:${numBorder}`);
  if (c.listNumSize !== undefined) {
    const size = clampListNumSize(c.listNumSize, 22);
    vars.push(`--num-size:${size}px`);
  }
  return vars.length ? `style="${vars.join(';')}"` : '';
}

/** Apply word-level styles to text — finds word occurrences and wraps them in styled spans */
export function applyWordStylesToText(
  text: string,
  wordStyles: Record<string, WordStyle>,
  field: string,
): string {
  if (!text) return '';
  if (!wordStyles || Object.keys(wordStyles).length === 0) return escapeHtml(text);

  // Collect applicable styles — sanitize each CSS value
  const applicable: { word: string; styleStr: string }[] = [];
  Object.keys(wordStyles).forEach((key) => {
    const [kf, word] = splitOnce(key, '::');
    const keyField = key.includes('::') ? kf : '*';
    if (keyField !== field && keyField !== '*') return;
    const styles = wordStyles[key];
    let styleStr = '';
    const fw = sanitizeFontWeight(styles.fontWeight);
    if (fw) styleStr += `font-weight:${fw};`;
    const fst = sanitizeFontStyle(styles.fontStyle);
    if (fst) styleStr += `font-style:${fst};`;
    const td = sanitizeTextDecoration(styles.textDecoration);
    if (td) styleStr += `text-decoration:${td};`;
    if (styles.fontSize !== undefined) {
      const size = clampFontSize(styles.fontSize, 16);
      styleStr += `font-size:${size}px;`;
    }
    const color = sanitizeHexColor(styles.color);
    if (color) styleStr += `color:${color};`;
    if (styleStr && word) applicable.push({ word, styleStr });
  });

  if (applicable.length === 0) return escapeHtml(text);

  // Find all word occurrences with word-boundary checks
  const ranges: { start: number; end: number; styleStr: string }[] = [];
  applicable.forEach(({ word, styleStr }) => {
    let idx = 0;
    while ((idx = text.indexOf(word, idx)) !== -1) {
      const before = text[idx - 1];
      const after = text[idx + word.length];
      if ((!before || !isWordChar(before)) && (!after || !isWordChar(after))) {
        ranges.push({ start: idx, end: idx + word.length, styleStr });
      }
      idx += word.length;
    }
  });

  if (ranges.length === 0) return escapeHtml(text);

  ranges.sort((a, b) => a.start - b.start || a.end - b.end);

  let html = '';
  let pos = 0;
  for (const r of ranges) {
    if (r.start < pos) continue; // overlap — skip
    html += escapeHtml(text.slice(pos, r.start));
    html += `<span class="cc-styled-word" style="${r.styleStr}">${escapeHtml(text.slice(r.start, r.end))}</span>`;
    pos = r.end;
  }
  html += escapeHtml(text.slice(pos));
  return html;
}

/** Check if a word exists as a whole word in the given text */
export function containsWholeWord(text: string, word: string): boolean {
  if (!word) return false;
  let idx = 0;
  while ((idx = text.indexOf(word, idx)) !== -1) {
    const before = text[idx - 1];
    const after = text[idx + word.length];
    if ((!before || !isWordChar(before)) && (!after || !isWordChar(after))) return true;
    idx += word.length;
  }
  return false;
}

/** Remove word styles that no longer match any text in the card.
 *  Mutates the card in place — kept for backward compatibility.
 *  Prefer findOrphanWordStyleKeys() + dispatch DELETE_CARD_WORD_STYLE. */
export function pruneOrphanWordStyles(card: Card): boolean {
  if (!card.wordStyles) return false;
  const orphans = findOrphanWordStyleKeys(card);
  orphans.forEach((key) => delete card.wordStyles[key]);
  return orphans.length > 0;
}

/** Find word style keys that no longer match any text in the card.
 *  Pure function — does not mutate. Returns array of orphan keys. */
export function findOrphanWordStyleKeys(card: Card): string[] {
  if (!card.wordStyles || Object.keys(card.wordStyles).length === 0) return [];
  const fieldTexts: Record<string, string> = {
    title: card.title,
    subtitle: card.subtitle,
    text: card.text,
    list: card.listItems,
    footer: card.footer,
    cta: card.cta,
  };
  const orphans: string[] = [];
  Object.keys(card.wordStyles).forEach((key) => {
    const [kf, word] = splitOnce(key, '::');
    const fieldText = fieldTexts[kf] ?? '';
    if (!word || !containsWholeWord(fieldText, word)) {
      orphans.push(key);
    }
  });
  return orphans;
}
