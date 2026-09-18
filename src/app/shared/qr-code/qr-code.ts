import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { qrDrawing } from './qr-matrix';

/**
 * Level 1: a scannable code. The pass shows it on a card and again, larger, in a dialog, and the
 * two are the same drawing at two sizes — an SVG scales without a second, bigger copy of anything.
 *
 * Ink and paper come from `--univgo-qr-ink` / `--univgo-qr-paper`, the one pair in the product that
 * does not follow the theme: the symbol is specified as dark on light and some readers refuse it
 * inverted, so a code that flipped with dark mode would be a code that sometimes cannot be read.
 * The surface around it is free to follow the theme, and does.
 *
 * The accessible name is the caller's: what this code stands for is the caller's subject, and a
 * name written here would describe the picture instead of the thing.
 */
@Component({
  selector: 'app-qr-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      padding: var(--univgo-space-s);
      border-radius: var(--tui-radius-s);
      background: var(--univgo-qr-paper);
      line-height: 0;
    }

    svg {
      inline-size: 100%;
      block-size: auto;
      fill: var(--univgo-qr-ink);
    }
  `,
  // `shape-rendering="crispEdges"` keeps the modules square at any size: anti-aliased edges blur a
  // module's boundary, which is the one thing a reader measures.
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + drawing().size + ' ' + drawing().size"
      shape-rendering="crispEdges"
      role="img"
      [attr.aria-label]="label()"
    >
      <path [attr.d]="drawing().path" />
    </svg>
  `,
})
export class QrCode {
  public readonly value = input.required<string>();
  public readonly label = input.required<string>();

  protected readonly drawing = computed(() => qrDrawing(this.value()));
}
