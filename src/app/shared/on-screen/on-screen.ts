import {
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  output,
} from '@angular/core';
import { ShellChrome } from '../shell-chrome/shell-chrome';

/**
 * Level 1: reports whether the element is inside the part of the viewport the person can actually
 * see.
 *
 * It exists so a view can offer a floating shortcut to an action that has scrolled out of reach and
 * withdraw it the moment the real control is back on screen — the shortcut never sits on top of the
 * button it stands in for.
 *
 * The shell's own chrome is discounted through `ShellChrome`: a control that slid under the sticky
 * header or behind the tab bar is out of reach, and the plain viewport would still call it visible
 * for as long as the bar is tall, which is exactly how long the person sees neither control.
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
    const chrome = inject(ShellChrome);
    const injector = inject(Injector);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      let observer: IntersectionObserver | undefined;

      effect(
        () => {
          observer?.disconnect();
          observer = new IntersectionObserver(
            ([entry]) => this.appOnScreen.emit(entry?.isIntersecting ?? false),
            {
              rootMargin: `${-chrome.insetBlockStart()}px 0px ${-chrome.insetBlockEnd()}px`,
            },
          );

          observer.observe(element);
        },
        { injector },
      );

      destroyRef.onDestroy(() => observer?.disconnect());
    });
  }
}
