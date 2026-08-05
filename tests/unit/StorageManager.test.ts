import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage before importing StorageManager
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Now import after mock is set up
const { save, load, clear, saveSidebarWidth, saveHeaderHeight, loadSidebarWidth, loadHeaderHeight } =
  await import('../../src/storage/StorageManager');

describe('StorageManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('save / load roundtrip', () => {
    it('saves and loads cards', () => {
      const cards = [
        {
          id: 'abc123',
          title: 'Hello',
          subtitle: '',
          text: '',
          listItems: '',
          footer: '',
          cta: '',
          colors: {},
          wordStyles: {},
          sectionStyles: {},
        },
      ];
      save({ cards });
      const loaded = load();
      expect(loaded.cards).toBeDefined();
      expect(loaded.cards).toHaveLength(1);
      expect(loaded.cards![0].title).toBe('Hello');
      expect(loaded.cards![0].id).toBe('abc123');
    });

    it('saves and loads theme', () => {
      save({ theme: 'obsidian-gold' });
      const loaded = load();
      expect(loaded.theme).toBe('obsidian-gold');
    });

    it('saves and loads format', () => {
      save({ format: 'aspect-4-5' });
      const loaded = load();
      expect(loaded.format).toBe('aspect-4-5');
    });

    it('saves and loads booleans', () => {
      save({ showCardNumbers: false, showProgressBar: true, charLimitEnabled: true });
      const loaded = load();
      expect(loaded.showCardNumbers).toBe(false);
      expect(loaded.showProgressBar).toBe(true);
      expect(loaded.charLimitEnabled).toBe(true);
    });

    it('saves and loads numbers', () => {
      save({ gradientAngle: 90 });
      const loaded = load();
      expect(loaded.gradientAngle).toBe(90);
    });

    it('strips empty objects before saving', () => {
      const cards = [
        {
          id: 'abc',
          title: 'Hello',
          subtitle: '',
          text: '',
          listItems: '',
          footer: '',
          cta: '',
          colors: {},
          wordStyles: {},
          sectionStyles: {},
        },
      ];
      save({ cards });
      // Verify that empty objects were stripped from saved JSON
      const saved = localStorageMock.getItem('flashcard-cards');
      expect(saved).not.toContain('"colors"');
      expect(saved).not.toContain('"wordStyles"');
    });
  });

  describe('load — corrupted data handling', () => {
    it('clears cards on corrupted JSON', () => {
      localStorageMock.setItem('flashcard-cards', 'not valid json{{{');
      const loaded = load();
      expect(loaded.cards).toBeUndefined();
      // Should have removed the corrupted key
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('flashcard-cards');
    });

    it('sanitizes XSS in card id', () => {
      const maliciousCard = [{ id: '" onclick="alert(1)', title: 'Hello' }];
      localStorageMock.setItem('flashcard-cards', JSON.stringify(maliciousCard));
      const loaded = load();
      expect(loaded.cards).toBeDefined();
      expect(loaded.cards![0].id).not.toContain('"');
      expect(loaded.cards![0].id).not.toContain('onclick');
    });

    it('sanitizes XSS in card theme', () => {
      const maliciousCard = [{ id: 'abc', title: 'Hello', theme: 'x" onmouseover="alert(1)' }];
      localStorageMock.setItem('flashcard-cards', JSON.stringify(maliciousCard));
      const loaded = load();
      expect(loaded.cards![0].theme).not.toContain('"');
      expect(loaded.cards![0].theme).not.toContain('onmouseover');
    });

    it('sanitizes invalid theme to default', () => {
      const card = [{ id: 'abc', title: 'Hello', theme: 'nonexistent-theme' }];
      localStorageMock.setItem('flashcard-cards', JSON.stringify(card));
      const loaded = load();
      expect(loaded.cards![0].theme).toBe('default');
    });

    it('sanitizes XSS in colors', () => {
      const card = [{ id: 'abc', title: 'Hello', colors: { title: 'javascript:alert(1)' } }];
      localStorageMock.setItem('flashcard-cards', JSON.stringify(card));
      const loaded = load();
      expect(loaded.cards![0].colors.title).toBeUndefined();
    });

    it('sanitizes invalid hex in colors', () => {
      const card = [{ id: 'abc', title: 'Hello', colors: { title: 'red' } }];
      localStorageMock.setItem('flashcard-cards', JSON.stringify(card));
      const loaded = load();
      expect(loaded.cards![0].colors.title).toBeUndefined();
    });

    it('keeps valid hex in colors', () => {
      const card = [{ id: 'abc', title: 'Hello', colors: { title: '#ff0000' } }];
      localStorageMock.setItem('flashcard-cards', JSON.stringify(card));
      const loaded = load();
      expect(loaded.cards![0].colors.title).toBe('#ff0000');
    });

    it('sanitizes invalid format', () => {
      localStorageMock.setItem('flashcard-format', 'evil-format');
      const loaded = load();
      expect(loaded.format).toBe('auto');
    });

    it('sanitizes invalid theme in THEME key', () => {
      localStorageMock.setItem('flashcard-theme', 'evil-theme');
      const loaded = load();
      expect(loaded.theme).toBe('default');
    });

    it('clamps gradientAngle to [0, 360]', () => {
      localStorageMock.setItem('flashcard-gradient-angle', '999');
      const loaded = load();
      expect(loaded.gradientAngle).toBe(360);
    });

    it('falls back to 135 for invalid gradientAngle', () => {
      localStorageMock.setItem('flashcard-gradient-angle', 'abc');
      const loaded = load();
      expect(loaded.gradientAngle).toBe(135);
    });

    it('clamps sidebarWidth to [260, 520]', () => {
      localStorageMock.setItem('flashcard-sidebar-width', '1000');
      const loaded = load();
      expect(loaded.sidebarWidth).toBe(520);
    });

    it('returns undefined for null sidebarWidth', () => {
      const loaded = load();
      expect(loaded.sidebarWidth).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('removes all keys', () => {
      save({ theme: 'obsidian-gold', format: 'auto' });
      clear();
      const loaded = load();
      expect(loaded.theme).toBeUndefined();
      expect(loaded.format).toBeUndefined();
    });
  });

  describe('sidebar/header helpers', () => {
    it('saveSidebarWidth clamps to [260, 520]', () => {
      saveSidebarWidth(1000);
      expect(loadSidebarWidth()).toBe(520);
      saveSidebarWidth(100);
      expect(loadSidebarWidth()).toBe(260);
      saveSidebarWidth(400);
      expect(loadSidebarWidth()).toBe(400);
    });

    it('saveHeaderHeight clamps to [60, 800]', () => {
      saveHeaderHeight(1000);
      expect(loadHeaderHeight()).toBe(800);
      saveHeaderHeight(10);
      expect(loadHeaderHeight()).toBe(60);
      saveHeaderHeight(200);
      expect(loadHeaderHeight()).toBe(200);
    });

    it('loadSidebarWidth returns null for missing key', () => {
      expect(loadSidebarWidth()).toBeNull();
    });

    it('loadHeaderHeight returns null for invalid value', () => {
      localStorageMock.setItem('flashcard-header-height', 'abc');
      expect(loadHeaderHeight()).toBeNull();
    });
  });

  describe('quota exceeded', () => {
    it('throws QuotaExceededError when localStorage is full', () => {
      localStorageMock.setItem.mockImplementation(() => {
        const err = new Error('Quota exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      });
      expect(() => save({ theme: 'default' })).toThrow('QuotaExceededError');
    });
  });
});
