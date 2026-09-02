import { describe, it, expect } from 'vitest';
import { HistoryManager } from '../../src/history/HistoryManager';

describe('HistoryManager', () => {
  it('initializes with a snapshot', () => {
    const h = new HistoryManager<number>();
    h.init(42);
    expect(h.canUndo).toBe(false);
    expect(h.canRedo).toBe(false);
  });

  it('push creates undo history', () => {
    const h = new HistoryManager<number>();
    h.init(1);
    h.push(2);
    h.push(3);
    expect(h.canUndo).toBe(true);
    expect(h.canRedo).toBe(false);
  });

  it('undo returns previous snapshot', () => {
    const h = new HistoryManager<number>();
    h.init(1);
    h.push(2);
    h.push(3);
    expect(h.undo()).toBe(2);
    expect(h.undo()).toBe(1);
  });

  it('undo at initial state returns null', () => {
    const h = new HistoryManager<number>();
    h.init(1);
    expect(h.undo()).toBeNull();
  });

  it('redo replays undone history', () => {
    const h = new HistoryManager<number>();
    h.init(1);
    h.push(2);
    h.push(3);
    h.undo(); // back to 2
    h.undo(); // back to 1
    expect(h.redo()).toBe(2);
    expect(h.redo()).toBe(3);
  });

  it('redo at latest returns null', () => {
    const h = new HistoryManager<number>();
    h.init(1);
    h.push(2);
    expect(h.redo()).toBeNull();
  });

  it('push after undo truncates redo branch', () => {
    const h = new HistoryManager<number>();
    h.init(1);
    h.push(2);
    h.push(3);
    h.undo(); // at 2
    h.push(99); // should truncate 3
    expect(h.canRedo).toBe(false);
    expect(h.undo()).toBe(2);
    expect(h.undo()).toBe(1);
    expect(h.redo()).toBe(2);
    expect(h.redo()).toBe(99);
  });

  it('push cancels pending schedulePush', () => {
    const h = new HistoryManager<number>();
    h.init(1);
    h.schedulePush(2, 100);
    h.push(99);
    // After push, the scheduled push should be cancelled
    // Wait for any timers
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // After 100ms, the scheduled push should NOT have fired
        // (it was cancelled by push)
        expect(h.canUndo).toBe(true);
        expect(h.undo()).toBe(1);
        resolve();
      }, 200);
    });
  });

  it('undo cancels pending schedulePush', () => {
    const h = new HistoryManager<number>();
    h.init(1);
    h.push(2);
    h.schedulePush(3, 100);
    h.undo(); // back to 1, should cancel the scheduled push of 3
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // The scheduled push of 3 should NOT have fired
        expect(h.canRedo).toBe(true); // 2 is still redoable
        resolve();
      }, 200);
    });
  });

  it('redo cancels pending schedulePush', () => {
    const h = new HistoryManager<number>();
    h.init(1);
    h.push(2);
    h.undo(); // at 1
    h.schedulePush(99, 100);
    h.redo(); // forward to 2, should cancel scheduled push
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // 99 should NOT be in history
        expect(h.canRedo).toBe(false);
        expect(h.undo()).toBe(1);
        expect(h.redo()).toBe(2);
        resolve();
      }, 200);
    });
  });

  it('schedulePush debounces rapid pushes', () => {
    const h = new HistoryManager<number>();
    h.init(1);
    h.schedulePush(2, 100);
    h.schedulePush(3, 100);
    h.schedulePush(4, 100);
    // All three schedulePush calls share the same timer (debounce)
    // Only the last one (4) should actually be pushed
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(h.canUndo).toBe(true);
        expect(h.undo()).toBe(1);
        expect(h.canRedo).toBe(true);
        expect(h.redo()).toBe(4);
        resolve();
      }, 200);
    });
  });

  it('MAX_HISTORY: push at boundary keeps histIndex correct', () => {
    // This is the regression test for the MAX_HISTORY corruption bug
    const h = new HistoryManager<number>(5);
    h.init(0);
    h.push(1);
    h.push(2);
    h.push(3);
    h.push(4);
    h.push(5); // Now at max (6 entries, but max=5, so shift happens)
    // After shift: history = [1,2,3,4,5], histIndex = 4
    expect(h.canUndo).toBe(true);
    expect(h.canRedo).toBe(false);
    // Undo should work — should go back through 4, 3, 2, 1
    expect(h.undo()).toBe(4);
    expect(h.undo()).toBe(3);
    expect(h.undo()).toBe(2);
    expect(h.undo()).toBe(1);
    expect(h.canUndo).toBe(false); // at the oldest entry
  });

  it('MAX_HISTORY: canRedo still works after overflow', () => {
    // Regression test: previously canRedo became permanently false at MAX_HISTORY
    const h = new HistoryManager<number>(3);
    h.init(0);
    h.push(1);
    h.push(2);
    h.push(3); // overflow — shift happens
    h.push(4); // another overflow
    // Undo a couple, then check redo
    h.undo();
    expect(h.canRedo).toBe(true);
    h.undo();
    expect(h.canRedo).toBe(true);
    expect(h.redo()).not.toBeNull();
  });

  it('clear empties history', () => {
    const h = new HistoryManager<number>();
    h.init(1);
    h.push(2);
    h.clear();
    expect(h.canUndo).toBe(false);
    expect(h.canRedo).toBe(false);
  });

  it('clear cancels pending schedulePush', () => {
    const h = new HistoryManager<number>();
    h.init(1);
    h.schedulePush(2, 100);
    h.clear();
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(h.canUndo).toBe(false);
        resolve();
      }, 200);
    });
  });

  it('snapshots are deep-cloned (not shared references)', () => {
    const h = new HistoryManager<{ arr: number[] }>();
    const initial = { arr: [1, 2, 3] };
    h.init(initial);
    initial.arr.push(4); // mutate after init
    const restored = h.undo();
    expect(restored).toBeNull(); // at initial, can't undo
    // But the internal snapshot should not have been mutated
    h.push({ arr: [99] });
    const undone = h.undo();
    expect(undone).toEqual({ arr: [1, 2, 3] }); // not [1,2,3,4]
  });
});
