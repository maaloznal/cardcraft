/**
 * Validation — centralized sanitization for all untrusted data.
 *
 * All data from localStorage is treated as untrusted. This module provides
 * pure validators that return sanitized values or safe defaults.
 *
 * No other module should sanitize localStorage data — call these functions.
 */

import type { Card, WordStyle, SectionStyle } from '../core/types';
import { THEME_GROUPS } from '../themes/themeData';

// ─── Whitelists ────────────────────────────────────────────────

/** Set of all valid theme values (built once from themeData) */
export const VALID_THEMES: ReadonlySet<string> = new Set(
  THEME_GROUPS.flatMap((g) => g.themes.map((t) => t.value)),
);

/** Set of all valid format values */
export const VALID_FORMATS: ReadonlySet<string> = new Set([
  'auto',
  'dynamic',
  'aspect-4-5',
  'aspect-9-16',
  'whatsapp',
  'telegram',
  'vk',
]);

/** Valid progress bar styles */
export const VALID_PROGRESS_STYLES: ReadonlySet<string> = new Set([
  'default',
  'dashed',
  'circles',
  'squares',
  'diamonds',
  'hexagons',
  'stars',
]);

/** Valid list styles */
export const VALID_LIST_STYLES: ReadonlySet<string> = new Set([
  'numbers',
  'bullets',
  'dashes',
  'circles',
  'squares',
  'decorative',
]);

// ─── Regex patterns ────────────────────────────────────────────

/** Hex color: #rgb, #rgba, #rrggbb, #rrggbbaa */
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

/** Safe id: alphanumeric, underscore, hyphen, 1-64 chars */
const SAFE_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

/** Safe theme/format/attribute value: lowercase letters, digits, hyphens */
const SAFE_ATTR_RE = /^[a-zA-Z0-9_-]+$/;

/** Safe font weight */
const VALID_FONT_WEIGHTS: ReadonlySet<string> = new Set(['normal', 'bold']);

/** Safe font style */
const VALID_FONT_STYLES: ReadonlySet<string> = new Set(['normal', 'italic']);

/** Font size bounds (px) */
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 96;

/** List number size bounds (px) */
const MIN_LIST_NUM_SIZE = 8;
const MAX_LIST_NUM_SIZE = 72;

// ─── Primitive sanitizers ──────────────────────────────────────

/** Sanitize a string for safe insertion into an HTML attribute value.
 *  Escapes characters that could break out of the attribute context. */
export function escapeAttr(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Validate hex color. Returns the color if valid, else null. */
export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_RE.test(value);
}

/** Sanitize hex color — returns valid color or null. */
export function sanitizeHexColor(value: unknown): string | null {
  return isValidHexColor(value) ? value : null;
}

/** Validate that a value is a safe attribute string (no quotes, brackets, etc.) */
export function isValidAttrValue(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ATTR_RE.test(value);
}

/** Sanitize a theme value — returns valid theme or DEFAULT_THEME. */
export function sanitizeTheme(value: unknown, fallback = 'default'): string {
  if (typeof value === 'string' && VALID_THEMES.has(value)) return value;
  return fallback;
}

/** Sanitize a format value — returns valid format or DEFAULT_FORMAT. */
export function sanitizeFormat(value: unknown, fallback = 'auto'): string {
  if (typeof value === 'string' && VALID_FORMATS.has(value)) return value;
  return fallback;
}

/** Sanitize a progress style — returns valid style or fallback. */
export function sanitizeProgressStyle(value: unknown, fallback = 'default'): string {
  if (typeof value === 'string' && VALID_PROGRESS_STYLES.has(value)) return value;
  return fallback;
}

/** Sanitize a list style — returns valid style or fallback. */
export function sanitizeListStyle(value: unknown, fallback = 'numbers'): string {
  if (typeof value === 'string' && VALID_LIST_STYLES.has(value)) return value;
  return fallback;
}

/** Validate a card id — must be safe alphanumeric/underscore/hyphen. */
export function isValidCardId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID_RE.test(value);
}

/** Clamp a font size to [8, 96]. Returns integer. */
export function clampFontSize(value: unknown, fallback = 16): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.round(n)));
}

/** Clamp a list number size to [8, 72]. Returns integer. */
export function clampListNumSize(value: unknown, fallback = 22): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(MIN_LIST_NUM_SIZE, Math.min(MAX_LIST_NUM_SIZE, Math.round(n)));
}

/** Sanitize a font weight — returns 'bold' or 'normal'. */
export function sanitizeFontWeight(value: unknown): string | undefined {
  if (typeof value === 'string' && VALID_FONT_WEIGHTS.has(value)) return value;
  return undefined;
}

/** Sanitize a font style — returns 'italic' or 'normal'. */
export function sanitizeFontStyle(value: unknown): string | undefined {
  if (typeof value === 'string' && VALID_FONT_STYLES.has(value)) return value;
  return undefined;
}

/** Sanitize text decoration — returns space-joined valid parts or undefined. */
export function sanitizeTextDecoration(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const parts = value.split(/\s+/).filter((p) => p === 'underline' || p === 'line-through');
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of parts) {
    if (!seen.has(p)) {
      seen.add(p);
      unique.push(p);
    }
  }
  return unique.length > 0 ? unique.join(' ') : undefined;
}

// ─── Complex sanitizers ────────────────────────────────────────

/** Sanitize a WordStyle object — strips invalid fields. */
export function sanitizeWordStyle(value: unknown): WordStyle {
  const result: WordStyle = {};
  if (!value || typeof value !== 'object') return result;
  const v = value as Record<string, unknown>;
  const fw = sanitizeFontWeight(v.fontWeight);
  if (fw) result.fontWeight = fw;
  const fs = sanitizeFontStyle(v.fontStyle);
  if (fs) result.fontStyle = fs;
  const td = sanitizeTextDecoration(v.textDecoration);
  if (td) result.textDecoration = td;
  const color = sanitizeHexColor(v.color);
  if (color) result.color = color;
  const fontSize = clampFontSize(v.fontSize, 16);
  if (fontSize !== 16) result.fontSize = fontSize;
  else if (typeof v.fontSize === 'number' || (typeof v.fontSize === 'string' && /^\d+$/.test(v.fontSize))) {
    result.fontSize = fontSize;
  }
  return result;
}

/** Sanitize a SectionStyle object — strips invalid fields. */
export function sanitizeSectionStyle(value: unknown): SectionStyle {
  const result: SectionStyle = {};
  if (!value || typeof value !== 'object') return result;
  const v = value as Record<string, unknown>;
  const fw = sanitizeFontWeight(v.fontWeight);
  if (fw) result.fontWeight = fw;
  const fs = sanitizeFontStyle(v.fontStyle);
  if (fs) result.fontStyle = fs;
  const td = sanitizeTextDecoration(v.textDecoration);
  if (td) result.textDecoration = td;
  if (typeof v.fontSize === 'number' || (typeof v.fontSize === 'string' && /^\d+$/.test(v.fontSize))) {
    result.fontSize = clampFontSize(v.fontSize, 16);
  }
  return result;
}

/** Sanitize a colors record — strips invalid hex values. */
export function sanitizeColors(value: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!value || typeof value !== 'object') return result;
  const v = value as Record<string, unknown>;
  for (const [key, val] of Object.entries(v)) {
    // listNumSize is a special key — it's a number stored as string
    if (key === 'listNumSize') {
      const size = clampListNumSize(val, 22);
      if (size !== 22) result[key] = String(size);
      continue;
    }
    const hex = sanitizeHexColor(val);
    if (hex) result[key] = hex;
  }
  return result;
}

/** Sanitize wordStyles record — strips invalid keys and values. */
export function sanitizeWordStyles(value: unknown): Record<string, WordStyle> {
  const result: Record<string, WordStyle> = {};
  if (!value || typeof value !== 'object') return result;
  const v = value as Record<string, unknown>;
  for (const [key, val] of Object.entries(v)) {
    // Key must be "field::word" format — validate field part
    const parts = key.split('::');
    if (parts.length !== 2) continue;
    const [field, word] = parts;
    if (!field || !word) continue;
    // Field must be a known field key
    const VALID_FIELDS = ['title', 'subtitle', 'text', 'list', 'footer', 'cta'];
    if (!VALID_FIELDS.includes(field)) continue;
    // Word must be a non-empty string, max 200 chars
    if (typeof word !== 'string' || word.length === 0 || word.length > 200) continue;
    const sanitized = sanitizeWordStyle(val);
    if (Object.keys(sanitized).length > 0) {
      result[key] = sanitized;
    }
  }
  return result;
}

/** Sanitize sectionStyles record — strips invalid keys and values. */
export function sanitizeSectionStyles(value: unknown): Record<string, SectionStyle> {
  const result: Record<string, SectionStyle> = {};
  if (!value || typeof value !== 'object') return result;
  const v = value as Record<string, unknown>;
  const VALID_FIELDS = ['title', 'subtitle', 'text', 'list', 'footer', 'cta'];
  for (const [field, val] of Object.entries(v)) {
    if (!VALID_FIELDS.includes(field)) continue;
    const sanitized = sanitizeSectionStyle(val);
    if (Object.keys(sanitized).length > 0) {
      result[field] = sanitized;
    }
  }
  return result;
}

/** Sanitize a text field — returns string, max 10000 chars. */
export function sanitizeText(value: unknown, maxLength = 10000): string {
  if (typeof value !== 'string') return '';
  // Strip null bytes and control chars except newline/tab
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, maxLength);
}

/** Sanitize a card id — returns valid id or generates a new one. */
export function sanitizeCardId(value: unknown): string {
  if (isValidCardId(value)) return value;
  // Generate a safe id
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** Fully sanitize a Card object from untrusted source (localStorage). */
export function sanitizeCard(card: unknown): Card {
  const c = (card && typeof card === 'object' ? card : {}) as Record<string, unknown>;
  return {
    id: sanitizeCardId(c.id),
    title: sanitizeText(c.title, 200),
    subtitle: sanitizeText(c.subtitle, 500),
    text: sanitizeText(c.text, 1000),
    listItems: sanitizeText(c.listItems, 1000),
    footer: sanitizeText(c.footer, 200),
    cta: sanitizeText(c.cta, 100),
    colors: sanitizeColors(c.colors),
    wordStyles: sanitizeWordStyles(c.wordStyles),
    sectionStyles: sanitizeSectionStyles(c.sectionStyles),
    theme: typeof c.theme === 'string' ? sanitizeTheme(c.theme) : undefined,
  };
}

/** Sanitize an array of cards — filters out non-objects, sanitizes each. */
export function sanitizeCards(value: unknown): Card[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c) => c && typeof c === 'object')
    .map(sanitizeCard);
}
