import type { WritableSignal } from '@angular/core';
import { DestroyRef, ElementRef, Injectable, afterNextRender, inject, signal } from '@angular/core';

/**
 * Level 1: what the shell puts over the page, and whether the view under it already offers the
 * action the shell would float.
 *
 * The two belong together because they answer the same question. A floating shortcut exists to
 * bring a control back within reach, so it has to know when the real one is reachable — and
 * "inside the viewport" is not that: the header is sticky and the tab bar is fixed, so an element
 * scrolled under either is gone from view while `IntersectionObserver` still calls it visible.
 */
@Injectable({ providedIn: 'root' })
export class ShellChrome {
  /** Pixels the shell covers at the top of the viewport. */
  public readonly insetBlockStart = signal(0);

  /** Pixels the shell covers at the bottom of the viewport. */
  public readonly insetBlockEnd = signal(0);

  /** Whether the view on screen is already offering the shell's quick action within reach. */
  public readonly quickActionInView = signal(false);
}

/**
 * Reports the host element's height into one of the insets while the component lives, and gives it
 * back on the way out: which chrome is on screen changes with the shell and with the breakpoint,
 * and a height left behind by a bar that is no longer there would shrink the viewport for everyone.
 */
export function reportShellInset(inset: WritableSignal<number>): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const destroyRef = inject(DestroyRef);

  afterNextRender(() => {
    const observer = new ResizeObserver(() => inset.set(host.offsetHeight));

    observer.observe(host);

    destroyRef.onDestroy(() => {
      observer.disconnect();
      inset.set(0);
    });
  });
}
