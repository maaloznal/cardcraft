import { describe, it, expect } from 'vitest';
import {
  buildSectionStyle,
  buildListNumStyle,
  applyWordStylesToText,
  containsWholeWord,
  pruneOrphanWordStyles,
} from '../../src/styles/StyleHelpers';
import type { Card } from '../../src/core/types';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'test-card',
    title: '',
    subtitle: '',
    text: '',
    listItems: '',
    footer: '',
    cta: '',
    colors: {},
    wordStyles: {},
    sectionStyles: {},
    ...overrides,
  };
}

describe('buildSectionStyle', () => {
  it('returns empty string for empty card', () => {
    expect(buildSectionStyle(makeCard(), 'title')).toBe('');
  });
  it('includes color when set', () => {
    const card = makeCard({ colors: { title: '#ff0000' } });
    const style = buildSectionStyle(card, 'title');
    expect(style).toContain('color:#ff0000');
  });
  it('includes fontWeight when set', () => {
    const card = makeCard({ sectionStyles: { title: { fontWeight: 'bold' } } });
    const style = buildSectionStyle(card, 'title');
    expect(style).toContain('font-weight:bold');
  });
  it('includes fontStyle when set', () => {
    const card = makeCard({ sectionStyles: { title: { fontStyle: 'italic' } } });
    const style = buildSectionStyle(card, 'title');
    expect(style).toContain('font-style:italic');
  });
  it('includes fontSize when set', () => {
    const card = makeCard({ sectionStyles: { title: { fontSize: 24 } } });
    const style = buildSectionStyle(card, 'title');
    expect(style).toContain('font-size:24px');
  });
  it('includes textDecoration when set', () => {
    const card = makeCard({ sectionStyles: { title: { textDecoration: 'underline' } } });
    const style = buildSectionStyle(card, 'title');
    expect(style).toContain('text-decoration:underline');
  });
  it('strips invalid color (CSS injection prevention)', () => {
    const card = makeCard({ colors: { title: 'red;background:url(evil)' } });
    const style = buildSectionStyle(card, 'title');
    expect(style).not.toContain('background');
    expect(style).not.toContain('url(evil)');
  });
  it('strips invalid fontWeight', () => {
    const card = makeCard({ sectionStyles: { title: { fontWeight: 'evil' } } });
    const style = buildSectionStyle(card, 'title');
    expect(style).not.toContain('font-weight:evil');
  });
  it('clamps fontSize to [8, 96]', () => {
    const card = makeCard({ sectionStyles: { title: { fontSize: 1000 } } });
    const style = buildSectionStyle(card, 'title');
    expect(style).toContain('font-size:96px');
  });
  it('returns empty style attribute when no styles set', () => {
    const card = makeCard();
    expect(buildSectionStyle(card, 'title')).toBe('');
  });
  it('wraps in style="..." attribute', () => {
    const card = makeCard({ colors: { title: '#ff0000' } });
    const style = buildSectionStyle(card, 'title');
    expect(style.startsWith('style="')).toBe(true);
    expect(style.endsWith('"')).toBe(true);
  });
});

describe('buildListNumStyle', () => {
  it('returns empty string for empty card', () => {
    expect(buildListNumStyle(makeCard())).toBe('');
  });
  it('includes --num-color', () => {
    const card = makeCard({ colors: { listNumber: '#ff0000' } });
    const style = buildListNumStyle(card);
    expect(style).toContain('--num-color:#ff0000');
  });
  it('includes --num-bg', () => {
    const card = makeCard({ colors: { listNumBg: '#00ff00' } });
    const style = buildListNumStyle(card);
    expect(style).toContain('--num-bg:#00ff00');
  });
  it('includes --num-border', () => {
    const card = makeCard({ colors: { listNumBorder: '#0000ff' } });
    const style = buildListNumStyle(card);
    expect(style).toContain('--num-border:#0000ff');
  });
  it('includes --num-size when listNumSize is set', () => {
    const card = makeCard({ colors: { listNumSize: '32' } });
    const style = buildListNumStyle(card);
    expect(style).toContain('--num-size:32px');
  });
  it('clamps listNumSize to [8, 72]', () => {
    const card = makeCard({ colors: { listNumSize: '1000' } });
    const style = buildListNumStyle(card);
    expect(style).toContain('--num-size:72px');
  });
  it('strips invalid hex', () => {
    const card = makeCard({ colors: { listNumber: 'evil' } });
    const style = buildListNumStyle(card);
    expect(style).toBe('');
  });
});

describe('applyWordStylesToText', () => {
  it('returns escaped text when no word styles', () => {
    const result = applyWordStylesToText('hello world', {}, 'title');
    expect(result).toBe('hello world');
  });
  it('returns empty string for empty text', () => {
    expect(applyWordStylesToText('', {}, 'title')).toBe('');
  });
  it('wraps matching word in styled span', () => {
    const wordStyles = { 'title::hello': { fontWeight: 'bold' } };
    const result = applyWordStylesToText('hello world', wordStyles, 'title');
    expect(result).toContain('<span class="cc-styled-word"');
    expect(result).toContain('font-weight:bold');
    expect(result).toContain('hello');
    expect(result).toContain('world');
  });
  it('escapes text content to prevent XSS', () => {
    const result = applyWordStylesToText('<script>alert(1)</script>', {}, 'title');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
  it('only matches whole words', () => {
    const wordStyles = { 'title::hello': { fontWeight: 'bold' } };
    const result = applyWordStylesToText('helloworld', wordStyles, 'title');
    expect(result).not.toContain('<span');
  });
  it('matches multiple occurrences', () => {
    const wordStyles = { 'title::hello': { fontWeight: 'bold' } };
    const result = applyWordStylesToText('hello hello hello', wordStyles, 'title');
    const spanCount = (result.match(/<span/g) || []).length;
    expect(spanCount).toBe(3);
  });
  it('only applies styles for matching field', () => {
    const wordStyles = { 'subtitle::hello': { fontWeight: 'bold' } };
    const result = applyWordStylesToText('hello world', wordStyles, 'title');
    expect(result).not.toContain('<span');
  });
  it('handles Cyrillic word boundaries', () => {
    const wordStyles = { 'title::привет': { fontWeight: 'bold' } };
    const result = applyWordStylesToText('привет мир', wordStyles, 'title');
    expect(result).toContain('<span');
  });
  it('sanitizes color in word style', () => {
    const wordStyles = { 'title::hello': { color: 'javascript:alert(1)' } };
    const result = applyWordStylesToText('hello', wordStyles, 'title');
    expect(result).not.toContain('javascript');
  });
  it('sanitizes fontWeight in word style', () => {
    const wordStyles = { 'title::hello': { fontWeight: 'evil' } };
    const result = applyWordStylesToText('hello', wordStyles, 'title');
    expect(result).not.toContain('font-weight:evil');
  });
  it('clamps fontSize in word style', () => {
    const wordStyles = { 'title::hello': { fontSize: 1000 } };
    const result = applyWordStylesToText('hello', wordStyles, 'title');
    expect(result).toContain('font-size:96px');
  });
});

describe('containsWholeWord (StyleHelpers version)', () => {
  it('finds whole word', () => {
    expect(containsWholeWord('hello world', 'hello')).toBe(true);
  });
  it('does not find substring', () => {
    expect(containsWholeWord('helloworld', 'hello')).toBe(false);
  });
});

describe('pruneOrphanWordStyles', () => {
  it('removes word styles for words no longer in text', () => {
    const card = makeCard({
      title: 'hello world',
      wordStyles: { 'title::hello': { fontWeight: 'bold' }, 'title::gone': { fontWeight: 'italic' } },
    });
    const changed = pruneOrphanWordStyles(card);
    expect(changed).toBe(true);
    expect(card.wordStyles).toHaveProperty('title::hello');
    expect(card.wordStyles).not.toHaveProperty('title::gone');
  });
  it('returns false when nothing changed', () => {
    const card = makeCard({
      title: 'hello world',
      wordStyles: { 'title::hello': { fontWeight: 'bold' } },
    });
    const changed = pruneOrphanWordStyles(card);
    expect(changed).toBe(false);
  });
  it('handles empty wordStyles', () => {
    const card = makeCard({ title: 'hello' });
    const changed = pruneOrphanWordStyles(card);
    expect(changed).toBe(false);
  });
  it('checks correct field for each word style', () => {
    const card = makeCard({
      title: 'hello',
      subtitle: 'world',
      wordStyles: {
        'title::hello': { fontWeight: 'bold' },
        'subtitle::world': { fontWeight: 'bold' },
        'title::world': { fontWeight: 'bold' }, // 'world' not in title — should be pruned
      },
    });
    pruneOrphanWordStyles(card);
    expect(card.wordStyles).toHaveProperty('title::hello');
    expect(card.wordStyles).toHaveProperty('subtitle::world');
    expect(card.wordStyles).not.toHaveProperty('title::world');
  });
});
