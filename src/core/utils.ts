/**
 * Pure utility functions — no side effects, no DOM access, no state.
 * Every function here can be unit-tested in isolation.
 */

/** Escape HTML special characters to prevent XSS */
export function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Generate a unique ID using crypto.randomUUID with fallback */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      /* fall through */
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

/** Deep clone via JSON — safe for serializable data (cards, snapshots) */
export function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Split string on first occurrence of separator */
export function splitOnce(s: string, sep: string): [string, string] {
  const i = s.indexOf(sep);
  if (i === -1) return [s, ''];
  return [s.slice(0, i), s.slice(i + sep.length)];
}

/** Check if character is a word character (letter, digit, underscore) — Unicode-aware */
export function isWordChar(c: string): boolean {
  return /[\p{L}\p{N}_]/u.test(c);
}

/** Check if `word` appears as a whole word in `text` (not substring) */
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

/** Strip the `text` meta field from a word style object */
export function stripMeta<T extends { text?: string }>(s: T): Omit<T, 'text'> {
  const { text: _omit, ...rest } = s;
  void _omit;
  return rest;
}
