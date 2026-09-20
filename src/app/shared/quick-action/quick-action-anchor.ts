import { DestroyRef, Directive, inject } from '@angular/core';
import { OnScreen } from '../on-screen/on-screen';
import { ShellChrome } from '../shell-chrome/shell-chrome';

/**
 * Level 1: marks the control with which a view offers the shell's quick action itself.
 *
 * While that control is within reach the shell withdraws its floating shortcut: two invitations to
 * the same action, one stacked over the other, read as clutter rather than as convenience. The view
 * reports rather than hides, because the shortcut is the shell's to draw.
 *
 * The flag is cleared when the control goes, so a view without one cannot inherit the answer the
 * previous view left behind.
 */
@Directive({
  selector: '[appQuickActionAnchor]',
  hostDirectives: [OnScreen],
})
export class QuickActionAnchor {
  constructor() {
    const chrome = inject(ShellChrome);

    // Taken as reachable the moment it exists, before the observer has had a frame to say so: a
    // view opens at the top, which is where its own action sits, so the shortcut that would flash
    // in and out over the first frames was never the right answer anyway.
    chrome.quickActionInView.set(true);

    inject(OnScreen).appOnScreen.subscribe((inView) => chrome.quickActionInView.set(inView));
    inject(DestroyRef).onDestroy(() => chrome.quickActionInView.set(false));
  }
}
