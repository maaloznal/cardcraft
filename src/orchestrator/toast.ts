/**
 * ToastQueue — toast notification queue with priority bypass.
 *
 * Long toasts (≥10000ms, e.g. batch download progress) bypass the queue
 * and replace the current toast immediately. Shorter toasts queue up
 * and play sequentially with a 200ms gap.
 *
 * Public API:
 *   new ToastQueue(element)        — bind to a toast DOM element
 *   show(msg, duration = 2500)     — display a toast (queued if short)
 *   destroy()                      — clear timer
 */

export class ToastQueue {
  private el: HTMLElement;
  private queue: Array<{ msg: string; duration: number }> = [];
  private showing = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(element: HTMLElement) {
    this.el = element;
  }

  show(msg: string, duration = 2500): void {
    // Long toasts bypass the queue
    if (this.showing && duration < 10000) {
      this.queue.push({ msg, duration });
      return;
    }
    this.el.textContent = msg;
    this.el.classList.add('show');
    this.showing = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.el.classList.remove('show');
      this.showing = false;
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        setTimeout(() => this.show(next.msg, next.duration), 200);
      }
    }, duration);
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer);
    this.queue.length = 0;
    this.showing = false;
  }
}
