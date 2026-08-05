import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateManager } from '../../src/state/StateManager';

describe('StateManager', () => {
  let sm: StateManager;

  beforeEach(() => {
    sm = new StateManager();
  });

  describe('initial state', () => {
    it('starts with one card', () => {
      expect(sm.getCardCount()).toBe(1);
    });
    it('card has valid id', () => {
      const card = sm.getCard(0);
      expect(card).not.toBeNull();
      expect(card!.id).toBeDefined();
      expect(card!.id.length).toBeGreaterThan(0);
    });
    it('card fields are empty strings', () => {
      const card = sm.getCard(0);
      expect(card!.title).toBe('');
      expect(card!.subtitle).toBe('');
      expect(card!.text).toBe('');
      expect(card!.listItems).toBe('');
      expect(card!.footer).toBe('');
      expect(card!.cta).toBe('');
    });
    it('default theme is "default"', () => {
      expect(sm.getTheme()).toBe('default');
    });
    it('default format is "auto"', () => {
      expect(sm.getFormat()).toBe('auto');
    });
  });

  describe('selectors', () => {
    it('getCards returns all cards', () => {
      expect(sm.getCards()).toHaveLength(1);
    });
    it('getCard returns null for out-of-bounds index', () => {
      expect(sm.getCard(-1)).toBeNull();
      expect(sm.getCard(99)).toBeNull();
    });
    it('getCardCount returns count', () => {
      expect(sm.getCardCount()).toBe(1);
    });
    it('getSettings returns settings object', () => {
      const s = sm.getSettings();
      expect(s.theme).toBe('default');
      expect(s.format).toBe('auto');
    });
  });

  describe('ADD_CARD', () => {
    it('adds a card to the end', () => {
      sm.dispatch({ type: 'ADD_CARD' });
      expect(sm.getCardCount()).toBe(2);
      const last = sm.getCard(1);
      expect(last).not.toBeNull();
      expect(last!.title).toBe('');
    });
    it('new card has a unique id', () => {
      const id1 = sm.getCard(0)!.id;
      sm.dispatch({ type: 'ADD_CARD' });
      const id2 = sm.getCard(1)!.id;
      expect(id1).not.toBe(id2);
    });
  });

  describe('DELETE_CARD', () => {
    it('deletes a card by index', () => {
      sm.dispatch({ type: 'ADD_CARD' });
      sm.dispatch({ type: 'DELETE_CARD', payload: 0 });
      expect(sm.getCardCount()).toBe(1);
    });
    it('cannot delete last remaining card', () => {
      sm.dispatch({ type: 'DELETE_CARD', payload: 0 });
      expect(sm.getCardCount()).toBe(1);
    });
    it('ignores out-of-bounds index', () => {
      sm.dispatch({ type: 'DELETE_CARD', payload: 99 });
      expect(sm.getCardCount()).toBe(1);
    });
    it('ignores negative index', () => {
      sm.dispatch({ type: 'DELETE_CARD', payload: -1 });
      expect(sm.getCardCount()).toBe(1);
    });
    it('ignores NaN index', () => {
      sm.dispatch({ type: 'DELETE_CARD', payload: NaN });
      expect(sm.getCardCount()).toBe(1);
    });
  });

  describe('DUPLICATE_CARD', () => {
    it('duplicates a card and inserts after original', () => {
      sm.dispatch({ type: 'UPDATE_CARD_FIELD', payload: { idx: 0, field: 'title', value: 'Hello' } });
      sm.dispatch({ type: 'DUPLICATE_CARD', payload: 0 });
      expect(sm.getCardCount()).toBe(2);
      expect(sm.getCard(1)!.title).toBe('Hello');
    });
    it('duplicate gets a new id', () => {
      const id1 = sm.getCard(0)!.id;
      sm.dispatch({ type: 'DUPLICATE_CARD', payload: 0 });
      const id2 = sm.getCard(1)!.id;
      expect(id1).not.toBe(id2);
    });
    it('ignores out-of-bounds index', () => {
      sm.dispatch({ type: 'DUPLICATE_CARD', payload: 99 });
      expect(sm.getCardCount()).toBe(1);
    });
  });

  describe('MOVE_CARD', () => {
    it('moves card up', () => {
      sm.dispatch({ type: 'UPDATE_CARD_FIELD', payload: { idx: 0, field: 'title', value: 'A' } });
      sm.dispatch({ type: 'ADD_CARD' });
      sm.dispatch({ type: 'UPDATE_CARD_FIELD', payload: { idx: 1, field: 'title', value: 'B' } });
      sm.dispatch({ type: 'MOVE_CARD', payload: { idx: 1, dir: -1 } });
      expect(sm.getCard(0)!.title).toBe('B');
      expect(sm.getCard(1)!.title).toBe('A');
    });
    it('moves card down', () => {
      sm.dispatch({ type: 'UPDATE_CARD_FIELD', payload: { idx: 0, field: 'title', value: 'A' } });
      sm.dispatch({ type: 'ADD_CARD' });
      sm.dispatch({ type: 'UPDATE_CARD_FIELD', payload: { idx: 1, field: 'title', value: 'B' } });
      sm.dispatch({ type: 'MOVE_CARD', payload: { idx: 0, dir: 1 } });
      expect(sm.getCard(0)!.title).toBe('B');
      expect(sm.getCard(1)!.title).toBe('A');
    });
    it('ignores move out of bounds', () => {
      sm.dispatch({ type: 'ADD_CARD' });
      const id1 = sm.getCard(0)!.id;
      sm.dispatch({ type: 'MOVE_CARD', payload: { idx: 0, dir: -1 } });
      expect(sm.getCard(0)!.id).toBe(id1);
    });
  });

  describe('UPDATE_CARD_FIELD', () => {
    it('updates a text field', () => {
      sm.dispatch({ type: 'UPDATE_CARD_FIELD', payload: { idx: 0, field: 'title', value: 'New Title' } });
      expect(sm.getCard(0)!.title).toBe('New Title');
    });
    it('ignores out-of-bounds index', () => {
      sm.dispatch({ type: 'UPDATE_CARD_FIELD', payload: { idx: 99, field: 'title', value: 'X' } });
      expect(sm.getCard(0)!.title).toBe('');
    });
  });

  describe('SET_CARD_THEME', () => {
    it('sets card theme', () => {
      sm.dispatch({ type: 'SET_CARD_THEME', payload: { idx: 0, theme: 'obsidian-gold' } });
      expect(sm.getCard(0)!.theme).toBe('obsidian-gold');
    });
    it('clears card theme with undefined', () => {
      sm.dispatch({ type: 'SET_CARD_THEME', payload: { idx: 0, theme: 'obsidian-gold' } });
      sm.dispatch({ type: 'SET_CARD_THEME', payload: { idx: 0, theme: undefined } });
      expect(sm.getCard(0)!.theme).toBeUndefined();
    });
  });

  describe('SET_CARD_COLORS', () => {
    it('replaces colors', () => {
      sm.dispatch({ type: 'SET_CARD_COLORS', payload: { idx: 0, colors: { title: '#ff0000' } } });
      expect(sm.getCard(0)!.colors).toEqual({ title: '#ff0000' });
    });
  });

  describe('SET_CARD_SECTION_STYLES', () => {
    it('replaces sectionStyles', () => {
      sm.dispatch({
        type: 'SET_CARD_SECTION_STYLES',
        payload: { idx: 0, sectionStyles: { title: { fontWeight: 'bold' } } },
      });
      expect(sm.getCard(0)!.sectionStyles).toEqual({ title: { fontWeight: 'bold' } });
    });
  });

  describe('SET_CARD_WORD_STYLES', () => {
    it('replaces wordStyles', () => {
      sm.dispatch({
        type: 'SET_CARD_WORD_STYLES',
        payload: { idx: 0, wordStyles: { 'title::hello': { fontWeight: 'bold' } } },
      });
      expect(sm.getCard(0)!.wordStyles).toEqual({ 'title::hello': { fontWeight: 'bold' } });
    });
  });

  describe('DELETE_CARD_WORD_STYLE', () => {
    it('deletes a word style by key', () => {
      sm.dispatch({
        type: 'SET_CARD_WORD_STYLES',
        payload: { idx: 0, wordStyles: { 'title::hello': { fontWeight: 'bold' } } },
      });
      sm.dispatch({ type: 'DELETE_CARD_WORD_STYLE', payload: { idx: 0, key: 'title::hello' } });
      expect(sm.getCard(0)!.wordStyles).toEqual({});
    });
    it('no-op if key does not exist', () => {
      const before = sm.getCard(0)!.wordStyles;
      sm.dispatch({ type: 'DELETE_CARD_WORD_STYLE', payload: { idx: 0, key: 'evil' } });
      expect(sm.getCard(0)!.wordStyles).toBe(before);
    });
  });

  describe('CLEAR_ALL', () => {
    it('replaces all cards with one empty card', () => {
      sm.dispatch({ type: 'ADD_CARD' });
      sm.dispatch({ type: 'ADD_CARD' });
      sm.dispatch({ type: 'CLEAR_ALL' });
      expect(sm.getCardCount()).toBe(1);
    });
  });

  describe('Settings actions', () => {
    it('SET_GLOBAL_THEME', () => {
      sm.dispatch({ type: 'SET_GLOBAL_THEME', payload: 'obsidian-gold' });
      expect(sm.getTheme()).toBe('obsidian-gold');
    });
    it('SET_FORMAT', () => {
      sm.dispatch({ type: 'SET_FORMAT', payload: 'aspect-4-5' });
      expect(sm.getFormat()).toBe('aspect-4-5');
    });
    it('SET_GRADIENT_ANGLE', () => {
      sm.dispatch({ type: 'SET_GRADIENT_ANGLE', payload: 90 });
      expect(sm.getGradientAngle()).toBe(90);
    });
    it('SET_SHOW_CARD_NUMBERS', () => {
      sm.dispatch({ type: 'SET_SHOW_CARD_NUMBERS', payload: false });
      expect(sm.getSettings().showCardNumbers).toBe(false);
    });
    it('SET_SHOW_PROGRESS_BAR', () => {
      sm.dispatch({ type: 'SET_SHOW_PROGRESS_BAR', payload: false });
      expect(sm.getSettings().showProgressBar).toBe(false);
    });
    it('SET_PROGRESS_BAR_STYLE', () => {
      sm.dispatch({ type: 'SET_PROGRESS_BAR_STYLE', payload: 'circles' });
      expect(sm.getProgressConfig().style).toBe('circles');
    });
    it('SET_LIST_STYLE', () => {
      sm.dispatch({ type: 'SET_LIST_STYLE', payload: 'bullets' });
      expect(sm.getListStyle()).toBe('bullets');
    });
    it('SET_CHAR_LIMIT', () => {
      sm.dispatch({ type: 'SET_CHAR_LIMIT', payload: true });
      expect(sm.getSettings().charLimitEnabled).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('notifies on dispatch', () => {
      const fn = vi.fn();
      sm.subscribe(fn);
      sm.dispatch({ type: 'ADD_CARD' });
      expect(fn).toHaveBeenCalledTimes(1);
    });
    it('returns unsubscribe function', () => {
      const fn = vi.fn();
      const unsub = sm.subscribe(fn);
      unsub();
      sm.dispatch({ type: 'ADD_CARD' });
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('snapshot / restore', () => {
    it('snapshot captures current state', () => {
      sm.dispatch({ type: 'UPDATE_CARD_FIELD', payload: { idx: 0, field: 'title', value: 'Hello' } });
      sm.dispatch({ type: 'SET_GLOBAL_THEME', payload: 'obsidian-gold' });
      const snap = sm.snapshot();
      expect(snap.cards[0].title).toBe('Hello');
      expect(snap.theme).toBe('obsidian-gold');
    });
    it('restore replaces cards and settings', () => {
      sm.dispatch({ type: 'UPDATE_CARD_FIELD', payload: { idx: 0, field: 'title', value: 'Hello' } });
      sm.dispatch({ type: 'SET_GLOBAL_THEME', payload: 'obsidian-gold' });
      const snap = sm.snapshot();

      sm.dispatch({ type: 'UPDATE_CARD_FIELD', payload: { idx: 0, field: 'title', value: 'Changed' } });
      sm.dispatch({ type: 'SET_GLOBAL_THEME', payload: 'default' });

      sm.restore(snap);
      expect(sm.getCard(0)!.title).toBe('Hello');
      expect(sm.getTheme()).toBe('obsidian-gold');
    });
    it('restore deep-clones cards (no shared references)', () => {
      sm.dispatch({ type: 'UPDATE_CARD_FIELD', payload: { idx: 0, field: 'title', value: 'Hello' } });
      const snap = sm.snapshot();
      // Mutate snapshot
      snap.cards[0].title = 'MUTATED';
      // State should be unaffected
      expect(sm.getCard(0)!.title).toBe('Hello');
    });
  });

  describe('setCards', () => {
    it('replaces all cards', () => {
      sm.setCards([
        { id: 'a', title: 'A', subtitle: '', text: '', listItems: '', footer: '', cta: '', colors: {}, wordStyles: {}, sectionStyles: {} },
        { id: 'b', title: 'B', subtitle: '', text: '', listItems: '', footer: '', cta: '', colors: {}, wordStyles: {}, sectionStyles: {} },
      ]);
      expect(sm.getCardCount()).toBe(2);
      expect(sm.getCard(0)!.title).toBe('A');
      expect(sm.getCard(1)!.title).toBe('B');
    });
  });
});
