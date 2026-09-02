import { describe, it, expect } from 'vitest';
import { escapeHtml, generateId, deepClone, splitOnce, isWordChar, containsWholeWord, stripMeta } from '../../src/core/utils';

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });
  it('escapes less-than', () => {
    expect(escapeHtml('<')).toBe('&lt;');
  });
  it('escapes greater-than', () => {
    expect(escapeHtml('>')).toBe('&gt;');
  });
  it('escapes double quote', () => {
    expect(escapeHtml('"')).toBe('&quot;');
  });
  it('escapes single quote', () => {
    expect(escapeHtml("'")).toBe('&#039;');
  });
  it('returns empty for null/undefined', () => {
    expect(escapeHtml(null as unknown as string)).toBe('');
    expect(escapeHtml(undefined as unknown as string)).toBe('');
  });
  it('handles plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
  it('prevents XSS — script tag', () => {
    const escaped = escapeHtml('<script>alert("xss")</script>');
    expect(escaped).not.toContain('<script>');
    expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
});

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });
  it('returns unique ids', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });
  it('id is non-empty', () => {
    expect(generateId().length).toBeGreaterThan(0);
  });
});

describe('deepClone', () => {
  it('clones a primitive', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
  });
  it('clones an object', () => {
    const obj = { a: 1, b: 'hello', c: [1, 2, 3] };
    const clone = deepClone(obj);
    expect(clone).toEqual(obj);
    expect(clone).not.toBe(obj);
    expect(clone.c).not.toBe(obj.c);
  });
  it('clones an array', () => {
    const arr = [{ a: 1 }, { b: 2 }];
    const clone = deepClone(arr);
    expect(clone).toEqual(arr);
    expect(clone).not.toBe(arr);
    expect(clone[0]).not.toBe(arr[0]);
  });
  it('clones nested objects', () => {
    const obj = { a: { b: { c: 1 } } };
    const clone = deepClone(obj);
    expect(clone).toEqual(obj);
    expect(clone.a).not.toBe(obj.a);
    expect(clone.a.b).not.toBe(obj.a.b);
  });
  it('does not share references', () => {
    const obj = { arr: [1, 2, 3] };
    const clone = deepClone(obj);
    clone.arr.push(4);
    expect(obj.arr).toEqual([1, 2, 3]);
    expect(clone.arr).toEqual([1, 2, 3, 4]);
  });
});

describe('splitOnce', () => {
  it('splits on first occurrence', () => {
    expect(splitOnce('a::b::c', '::')).toEqual(['a', 'b::c']);
  });
  it('returns [str, ""] if separator not found', () => {
    expect(splitOnce('abc', '::')).toEqual(['abc', '']);
  });
  it('handles empty string', () => {
    expect(splitOnce('', '::')).toEqual(['', '']);
  });
  it('handles separator at start', () => {
    expect(splitOnce('::abc', '::')).toEqual(['', 'abc']);
  });
});

describe('isWordChar', () => {
  it('returns true for letters', () => {
    expect(isWordChar('a')).toBe(true);
    expect(isWordChar('z')).toBe(true);
    expect(isWordChar('A')).toBe(true);
    expect(isWordChar('Z')).toBe(true);
  });
  it('returns true for digits', () => {
    expect(isWordChar('0')).toBe(true);
    expect(isWordChar('9')).toBe(true);
  });
  it('returns true for underscore', () => {
    expect(isWordChar('_')).toBe(true);
  });
  it('returns true for Cyrillic', () => {
    expect(isWordChar('а')).toBe(true);
    expect(isWordChar('я')).toBe(true);
    expect(isWordChar('А')).toBe(true);
  });
  it('returns false for whitespace', () => {
    expect(isWordChar(' ')).toBe(false);
    expect(isWordChar('\t')).toBe(false);
    expect(isWordChar('\n')).toBe(false);
  });
  it('returns false for punctuation', () => {
    expect(isWordChar('.')).toBe(false);
    expect(isWordChar(',')).toBe(false);
    expect(isWordChar('!')).toBe(false);
    expect(isWordChar('-')).toBe(false);
  });
});

describe('containsWholeWord', () => {
  it('finds word at start', () => {
    expect(containsWholeWord('hello world', 'hello')).toBe(true);
  });
  it('finds word at end', () => {
    expect(containsWholeWord('hello world', 'world')).toBe(true);
  });
  it('finds word in middle', () => {
    expect(containsWholeWord('hello big world', 'big')).toBe(true);
  });
  it('finds standalone word', () => {
    expect(containsWholeWord('hello', 'hello')).toBe(true);
  });
  it('does not find substring', () => {
    expect(containsWholeWord('helloworld', 'hello')).toBe(false);
  });
  it('handles word boundaries with punctuation', () => {
    expect(containsWholeWord('hello, world', 'hello')).toBe(true);
    expect(containsWholeWord('hello.world', 'hello')).toBe(true);
  });
  it('handles Cyrillic', () => {
    expect(containsWholeWord('привет мир', 'привет')).toBe(true);
    expect(containsWholeWord('приветмир', 'привет')).toBe(false);
  });
  it('returns false for empty word', () => {
    expect(containsWholeWord('hello', '')).toBe(false);
  });
  it('finds multiple occurrences', () => {
    expect(containsWholeWord('hello hello hello', 'hello')).toBe(true);
  });
});

describe('stripMeta', () => {
  it('strips "text" meta and keeps the rest', () => {
    const result = stripMeta({ text: 'hello', fontWeight: 'bold', color: '#ff0000' });
    expect(result).toEqual({ fontWeight: 'bold', color: '#ff0000' });
  });
  it('returns empty object if only text', () => {
    const result = stripMeta({ text: 'hello' });
    expect(result).toEqual({});
  });
  it('returns all if no text key', () => {
    const result = stripMeta({ text: undefined, fontWeight: 'bold' });
    expect(result).toEqual({ fontWeight: 'bold' });
  });
});
