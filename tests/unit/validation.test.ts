import { describe, it, expect } from 'vitest';
import {
  escapeAttr,
  isValidHexColor,
  sanitizeHexColor,
  sanitizeTheme,
  sanitizeFormat,
  sanitizeProgressStyle,
  sanitizeListStyle,
  isValidCardId,
  clampFontSize,
  clampListNumSize,
  sanitizeFontWeight,
  sanitizeFontStyle,
  sanitizeTextDecoration,
  sanitizeColors,
  sanitizeWordStyles,
  sanitizeSectionStyles,
  sanitizeText,
  sanitizeCardId,
  sanitizeCard,
  sanitizeCards,
  VALID_THEMES,
  VALID_FORMATS,
} from '../../src/core/validation';

describe('escapeAttr', () => {
  it('escapes double quotes', () => {
    expect(escapeAttr('a"b')).toBe('a&quot;b');
  });
  it('escapes single quotes', () => {
    expect(escapeAttr("a'b")).toBe('a&#039;b');
  });
  it('escapes angle brackets', () => {
    expect(escapeAttr('<script>')).toBe('&lt;script&gt;');
  });
  it('escapes ampersand', () => {
    expect(escapeAttr('a&b')).toBe('a&amp;b');
  });
  it('handles empty string', () => {
    expect(escapeAttr('')).toBe('');
  });
  it('handles non-string input (null)', () => {
    expect(escapeAttr(null as unknown as string)).toBe('');
  });
  it('prevents attribute breakout — onclick injection', () => {
    const malicious = '" onclick="alert(1)';
    const escaped = escapeAttr(malicious);
    // The escaped string should not contain unescaped double quotes
    expect(escaped).not.toContain('"');
    expect(escaped).toBe('&quot; onclick=&quot;alert(1)');
  });
});

describe('isValidHexColor', () => {
  it('validates 6-digit hex', () => {
    expect(isValidHexColor('#ff0000')).toBe(true);
    expect(isValidHexColor('#FFFFFF')).toBe(true);
  });
  it('validates 3-digit hex', () => {
    expect(isValidHexColor('#f00')).toBe(true);
    expect(isValidHexColor('#FFF')).toBe(true);
  });
  it('rejects invalid hex', () => {
    expect(isValidHexColor('red')).toBe(false);
    expect(isValidHexColor('#ff')).toBe(false);
    expect(isValidHexColor('#gggggg')).toBe(false);
    expect(isValidHexColor('')).toBe(false);
  });
  it('rejects non-string', () => {
    expect(isValidHexColor(123)).toBe(false);
    expect(isValidHexColor(null)).toBe(false);
    expect(isValidHexColor(undefined)).toBe(false);
  });
});

describe('sanitizeHexColor', () => {
  it('returns valid color', () => {
    expect(sanitizeHexColor('#ff0000')).toBe('#ff0000');
  });
  it('returns null for invalid', () => {
    expect(sanitizeHexColor('red')).toBeNull();
    expect(sanitizeHexColor(null)).toBeNull();
    expect(sanitizeHexColor('javascript:alert(1)')).toBeNull();
  });
});

describe('sanitizeTheme', () => {
  it('returns valid theme', () => {
    expect(sanitizeTheme('default')).toBe('default');
    expect(sanitizeTheme('obsidian-gold')).toBe('obsidian-gold');
  });
  it('returns fallback for invalid theme', () => {
    expect(sanitizeTheme('x" onclick="alert(1)')).toBe('default');
    expect(sanitizeTheme(null)).toBe('default');
    expect(sanitizeTheme('')).toBe('default');
  });
  it('uses custom fallback', () => {
    expect(sanitizeTheme('invalid', 'obsidian-gold')).toBe('obsidian-gold');
  });
});

describe('sanitizeFormat', () => {
  it('returns valid format', () => {
    expect(sanitizeFormat('auto')).toBe('auto');
    expect(sanitizeFormat('dynamic')).toBe('dynamic');
    expect(sanitizeFormat('aspect-4-5')).toBe('aspect-4-5');
    expect(sanitizeFormat('vk')).toBe('vk');
  });
  it('returns fallback for invalid', () => {
    expect(sanitizeFormat('x" onmouseover="alert(1)')).toBe('auto');
    expect(sanitizeFormat(null)).toBe('auto');
  });
});

describe('sanitizeProgressStyle', () => {
  it('returns valid style', () => {
    expect(sanitizeProgressStyle('circles')).toBe('circles');
    expect(sanitizeProgressStyle('dashed')).toBe('dashed');
  });
  it('returns fallback for invalid', () => {
    expect(sanitizeProgressStyle('evil')).toBe('default');
    expect(sanitizeProgressStyle(null)).toBe('default');
  });
});

describe('sanitizeListStyle', () => {
  it('returns valid style', () => {
    expect(sanitizeListStyle('bullets')).toBe('bullets');
    expect(sanitizeListStyle('numbers')).toBe('numbers');
  });
  it('returns fallback for invalid', () => {
    expect(sanitizeListStyle('evil')).toBe('numbers');
  });
});

describe('isValidCardId', () => {
  it('validates safe alphanumeric id', () => {
    expect(isValidCardId('abc123')).toBe(true);
    expect(isValidCardId('card-001_test')).toBe(true);
    expect(isValidCardId('a-b-c_d-e-f')).toBe(true);
  });
  it('rejects ids with special chars', () => {
    expect(isValidCardId('a"b')).toBe(false);
    expect(isValidCardId('a<b>')).toBe(false);
    expect(isValidCardId('onclick=alert(1)')).toBe(false);
    expect(isValidCardId('')).toBe(false);
    expect(isValidCardId(null as unknown as string)).toBe(false);
  });
  it('rejects too-long id (>64 chars)', () => {
    expect(isValidCardId('a'.repeat(65))).toBe(false);
    expect(isValidCardId('a'.repeat(64))).toBe(true);
  });
});

describe('clampFontSize', () => {
  it('clamps to [8, 96]', () => {
    expect(clampFontSize(10)).toBe(10);
    expect(clampFontSize(50)).toBe(50);
    expect(clampFontSize(96)).toBe(96);
  });
  it('clamps below minimum', () => {
    expect(clampFontSize(0)).toBe(8);
    expect(clampFontSize(-10)).toBe(8);
  });
  it('clamps above maximum', () => {
    expect(clampFontSize(100)).toBe(96);
    expect(clampFontSize(1000)).toBe(96);
  });
  it('rounds to integer', () => {
    expect(clampFontSize(16.7)).toBe(17);
    expect(clampFontSize(16.4)).toBe(16);
  });
  it('handles NaN with fallback', () => {
    expect(clampFontSize(NaN)).toBe(16);
    expect(clampFontSize('abc')).toBe(16);
  });
  it('handles string input', () => {
    expect(clampFontSize('24')).toBe(24);
  });
});

describe('clampListNumSize', () => {
  it('clamps to [8, 72]', () => {
    expect(clampListNumSize(22)).toBe(22);
    expect(clampListNumSize(72)).toBe(72);
    expect(clampListNumSize(8)).toBe(8);
  });
  it('clamps below minimum', () => {
    expect(clampListNumSize(0)).toBe(8);
  });
  it('clamps above maximum', () => {
    expect(clampListNumSize(100)).toBe(72);
  });
  it('handles NaN with fallback', () => {
    expect(clampListNumSize(NaN)).toBe(22);
  });
});

describe('sanitizeFontWeight', () => {
  it('returns valid weight', () => {
    expect(sanitizeFontWeight('bold')).toBe('bold');
    expect(sanitizeFontWeight('normal')).toBe('normal');
  });
  it('returns undefined for invalid', () => {
    expect(sanitizeFontWeight('evil; background:url(evil)')).toBeUndefined();
    expect(sanitizeFontWeight(null)).toBeUndefined();
  });
});

describe('sanitizeFontStyle', () => {
  it('returns valid style', () => {
    expect(sanitizeFontStyle('italic')).toBe('italic');
    expect(sanitizeFontStyle('normal')).toBe('normal');
  });
  it('returns undefined for invalid', () => {
    expect(sanitizeFontStyle('evil')).toBeUndefined();
  });
});

describe('sanitizeTextDecoration', () => {
  it('returns valid decoration', () => {
    expect(sanitizeTextDecoration('underline')).toBe('underline');
    expect(sanitizeTextDecoration('line-through')).toBe('line-through');
    expect(sanitizeTextDecoration('underline line-through')).toBe('underline line-through');
  });
  it('deduplicates parts', () => {
    expect(sanitizeTextDecoration('underline underline')).toBe('underline');
  });
  it('returns undefined for invalid', () => {
    expect(sanitizeTextDecoration('evil')).toBeUndefined();
    expect(sanitizeTextDecoration(null)).toBeUndefined();
  });
  it('strips invalid parts', () => {
    expect(sanitizeTextDecoration('underline evil line-through')).toBe('underline line-through');
  });
});

describe('sanitizeColors', () => {
  it('sanitizes valid colors', () => {
    const result = sanitizeColors({ title: '#ff0000', text: '#00ff00' });
    expect(result).toEqual({ title: '#ff0000', text: '#00ff00' });
  });
  it('strips invalid hex', () => {
    const result = sanitizeColors({ title: 'red', text: '#00ff00', bad: 'javascript:alert(1)' });
    expect(result).toEqual({ text: '#00ff00' });
  });
  it('handles listNumSize specially — clamps as number', () => {
    const result = sanitizeColors({ listNumSize: '32' });
    expect(result).toEqual({ listNumSize: '32' });
  });
  it('returns empty object for non-object', () => {
    expect(sanitizeColors(null)).toEqual({});
    expect(sanitizeColors('evil')).toEqual({});
    expect(sanitizeColors(undefined)).toEqual({});
  });
});

describe('sanitizeWordStyles', () => {
  it('sanitizes valid word styles', () => {
    const result = sanitizeWordStyles({
      'title::hello': { fontWeight: 'bold', color: '#ff0000' },
    });
    expect(result['title::hello']).toBeDefined();
    expect(result['title::hello'].fontWeight).toBe('bold');
    expect(result['title::hello'].color).toBe('#ff0000');
  });
  it('strips invalid field in key', () => {
    const result = sanitizeWordStyles({
      'evil::hello': { fontWeight: 'bold' },
    });
    expect(result).toEqual({});
  });
  it('strips invalid values but keeps valid ones', () => {
    const result = sanitizeWordStyles({
      'title::hello': { fontWeight: 'evil', color: 'red' },
    });
    // Both fontWeight and color are invalid, so the word style should be empty
    expect(Object.keys(result['title::hello'] || {}).length).toBe(0);
  });
  it('strips keys without :: separator', () => {
    const result = sanitizeWordStyles({
      'hello': { fontWeight: 'bold' },
    });
    expect(result).toEqual({});
  });
  it('strips keys with empty word', () => {
    const result = sanitizeWordStyles({
      'title::': { fontWeight: 'bold' },
    });
    expect(result).toEqual({});
  });
});

describe('sanitizeSectionStyles', () => {
  it('sanitizes valid section styles', () => {
    const result = sanitizeSectionStyles({
      title: { fontWeight: 'bold', fontSize: 24 },
    });
    expect(result).toEqual({ title: { fontWeight: 'bold', fontSize: 24 } });
  });
  it('strips invalid field', () => {
    const result = sanitizeSectionStyles({
      evil: { fontWeight: 'bold' },
    });
    expect(result).toEqual({});
  });
});

describe('sanitizeText', () => {
  it('returns string as-is (within limit)', () => {
    expect(sanitizeText('hello')).toBe('hello');
  });
  it('strips control chars except newline/tab', () => {
    expect(sanitizeText('hello\x00world')).toBe('helloworld');
    expect(sanitizeText('hello\nworld')).toBe('hello\nworld');
    expect(sanitizeText('hello\tworld')).toBe('hello\tworld');
  });
  it('truncates to maxLength', () => {
    expect(sanitizeText('hello', 3)).toBe('hel');
  });
  it('returns empty for non-string', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(123)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });
});

describe('sanitizeCardId', () => {
  it('returns valid id', () => {
    expect(sanitizeCardId('abc123')).toBe('abc123');
  });
  it('generates new id for invalid', () => {
    const newId = sanitizeCardId('a"b');
    expect(newId).not.toBe('a"b');
    expect(isValidCardId(newId)).toBe(true);
  });
  it('generates new id for null', () => {
    const newId = sanitizeCardId(null);
    expect(isValidCardId(newId)).toBe(true);
  });
});

describe('sanitizeCard', () => {
  it('sanitizes a valid card', () => {
    const card = sanitizeCard({
      id: 'abc123',
      title: 'Hello',
      subtitle: 'World',
      colors: { title: '#ff0000' },
    });
    expect(card.id).toBe('abc123');
    expect(card.title).toBe('Hello');
    expect(card.colors.title).toBe('#ff0000');
  });
  it('strips XSS from id', () => {
    const card = sanitizeCard({
      id: '" onclick="alert(1)',
      title: 'Hello',
    });
    expect(card.id).not.toContain('"');
    expect(card.id).not.toContain('onclick');
  });
  it('strips XSS from colors', () => {
    const card = sanitizeCard({
      id: 'abc',
      title: 'Hello',
      colors: { title: 'javascript:alert(1)' },
    });
    expect(card.colors.title).toBeUndefined();
  });
  it('strips XSS from theme', () => {
    const card = sanitizeCard({
      id: 'abc',
      title: 'Hello',
      theme: 'x" onmouseover="alert(1)',
    });
    expect(card.theme).toBe('default');
  });
  it('handles null input', () => {
    const card = sanitizeCard(null);
    expect(card.id).toBeDefined();
    expect(card.title).toBe('');
  });
  it('strips control chars from text fields', () => {
    const card = sanitizeCard({
      id: 'abc',
      title: 'hello\x00world',
    });
    expect(card.title).toBe('helloworld');
  });
});

describe('sanitizeCards', () => {
  it('filters non-objects', () => {
    const result = sanitizeCards([null, 'evil', { id: 'abc', title: 'Hello' }, 123]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Hello');
  });
  it('returns empty for non-array', () => {
    expect(sanitizeCards(null)).toEqual([]);
    expect(sanitizeCards('evil')).toEqual([]);
  });
});

describe('whitelist sets', () => {
  it('VALID_THEMES contains expected themes', () => {
    expect(VALID_THEMES.has('default')).toBe(true);
    expect(VALID_THEMES.has('obsidian-gold')).toBe(true);
    expect(VALID_THEMES.has('nobg-dark')).toBe(true);
    expect(VALID_THEMES.size).toBeGreaterThanOrEqual(90);
  });
  it('VALID_FORMATS contains expected formats', () => {
    expect(VALID_FORMATS.has('auto')).toBe(true);
    expect(VALID_FORMATS.has('aspect-4-5')).toBe(true);
    expect(VALID_FORMATS.has('vk')).toBe(true);
    expect(VALID_FORMATS.size).toBe(7);
  });
  it('whitelist rejects injection attempts', () => {
    expect(VALID_THEMES.has('x" onclick="alert(1)')).toBe(false);
    expect(VALID_FORMATS.has('x" onclick="alert(1)')).toBe(false);
  });
});
