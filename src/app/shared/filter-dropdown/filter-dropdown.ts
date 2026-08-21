import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TuiButton, TuiDropdown } from '@taiga-ui/core';

/**
 * Level 2: one filter of the reservation list — the trigger that carries the filter's state and the
 * panel it opens. Three of these existed as copies of the same fourteen lines, differing only in
 * the label and in which signal they read.
 *
 * The panel is a `fieldset` named by the trigger: a group of controls with no accessible name tells
 * a screen reader nothing, and the trigger already carries the word, translated and on screen. The
 * panel's content is projected, so a filter can be a list of checkboxes or a calendar without this
 * component knowing which.
 */
let nextTriggerId = 0;

@Component({
  selector: 'app-filter-dropdown',
  imports: [TuiButton, TuiDropdown],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
    }

    fieldset {
      display: flex;
      flex-direction: column;
      gap: var(--univgo-space-s);
      min-inline-size: 12rem;
      margin: 0;
      padding: var(--univgo-space-m);
      border: none;
    }
  `,
  template: `
    <!-- Teal marks a filter that is narrowing the list: it is the palette's "in effect" colour, and
         the check icon repeats the state without relying on colour (WCAG 1.4.1). -->
    <button
      tuiButton
      type="button"
      size="m"
      [id]="triggerId"
      [appearance]="active() ? 'accent' : 'outline'"
      [iconStart]="active() ? '@tui.check' : null"
      iconEnd="@tui.chevron-down"
      [tuiDropdown]="panel"
      [(tuiDropdownOpen)]="open"
    >
      {{ label() }}
    </button>

    <ng-template #panel>
      <fieldset [attr.aria-labelledby]="triggerId">
        <ng-content />
      </fieldset>
    </ng-template>
  `,
})
export class FilterDropdown {
  public readonly label = input.required<string>();
  /** Whether the filter is narrowing the list, which is what the closed trigger has to convey. */
  public readonly active = input.required<boolean>();

  /** The panel is rendered in a portal, so naming it takes an id that is unique in the document. */
  protected readonly triggerId = `filter-trigger-${nextTriggerId++}`;

  protected readonly open = signal(false);
}
