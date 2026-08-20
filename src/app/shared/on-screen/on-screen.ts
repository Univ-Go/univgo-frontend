import { DestroyRef, Directive, ElementRef, afterNextRender, inject, output } from '@angular/core';

/**
 * Level 1: reports whether the element is inside the viewport.
 *
 * It exists so a view can offer a floating shortcut to an action that has scrolled out of reach and
 * withdraw it the moment the real control is back on screen — the shortcut never sits on top of the
 * button it stands in for.
 *
 * Not Taiga's `tuiObscured`: that answers a different question — whether something is *covering* the
 * element — and answers it by polling `elementFromPoint` every 100ms, which is the wrong trade when
 * the browser offers a callback for exactly this.
 */
@Directive({ selector: '[appOnScreen]' })
export class OnScreen {
  public readonly appOnScreen = output<boolean>();

  constructor() {
    const element = inject<ElementRef<Element>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const observer = new IntersectionObserver(([entry]) =>
        this.appOnScreen.emit(entry?.isIntersecting ?? false),
      );

      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
