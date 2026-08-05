/**
 * HistoryManager — generic undo/redo stack with debounced snapshots.
 * Not tied to any specific state shape.
 */

import { deepClone } from '../core/utils';
import { CONFIG } from '../core/constants';

export class HistoryManager<T> {
  private history: T[] = [];
  private histIndex = -1;
  private historyTimer: ReturnType<typeof setTimeout> | null = null;
  private maxHistory: number;

  constructor(maxHistory?: number) {
    this.maxHistory = maxHistory ?? CONFIG.MAX_HISTORY;
  }

  /** Take an immediate snapshot. Cancels any pending debounced push. */
  push(snapshot: T): void {
    // Cancel pending schedulePush — an immediate push supersedes it.
    if (this.historyTimer) {
      clearTimeout(this.historyTimer);
      this.historyTimer = null;
    }
    // Truncate any redo entries (branch divergence)
    this.history = this.history.slice(0, this.histIndex + 1);
    this.history.push(deepClone(snapshot));
    this.histIndex++;
    // Enforce max history — remove oldest entry and keep histIndex in bounds
    while (this.history.length > this.maxHistory) {
      this.history.shift();
      this.histIndex--; // The window slid left — adjust index to stay on same snapshot
    }
    // Safety clamp: histIndex must always be within [0, length-1]
    if (this.histIndex < 0) this.histIndex = 0;
    if (this.histIndex >= this.history.length) this.histIndex = this.history.length - 1;
  }

  /** Debounced push — merges rapid changes into one snapshot */
  schedulePush(snapshot: T, delay?: number): void {
    const ms = delay ?? CONFIG.HISTORY_DEBOUNCE_MS;
    if (this.historyTimer) clearTimeout(this.historyTimer);
    this.historyTimer = setTimeout(() => this.push(snapshot), ms);
  }

  /** Undo — returns previous snapshot or null. Cancels any pending debounced push. */
  undo(): T | null {
    if (this.histIndex <= 0) return null;
    // Cancel pending schedulePush — otherwise it would fire after undo
    // and push a pre-undo snapshot, corrupting the redo stack.
    if (this.historyTimer) {
      clearTimeout(this.historyTimer);
      this.historyTimer = null;
    }
    this.histIndex--;
    return deepClone(this.history[this.histIndex]);
  }

  /** Redo — returns next snapshot or null. Cancels any pending debounced push. */
  redo(): T | null {
    if (this.histIndex >= this.history.length - 1) return null;
    if (this.historyTimer) {
      clearTimeout(this.historyTimer);
      this.historyTimer = null;
    }
    this.histIndex++;
    return deepClone(this.history[this.histIndex]);
  }

  /** Initialize with starting snapshot */
  init(snapshot: T): void {
    this.history = [deepClone(snapshot)];
    this.histIndex = 0;
  }

  get canUndo(): boolean {
    return this.histIndex > 0;
  }

  get canRedo(): boolean {
    return this.histIndex < this.history.length - 1;
  }

  clear(): void {
    this.history = [];
    this.histIndex = -1;
    if (this.historyTimer) {
      clearTimeout(this.historyTimer);
      this.historyTimer = null;
    }
  }
}
