import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';

/**
 * Level 1: "there is nothing to show, and here is why". Every list and every lookup in the product
 * needs one, and the three that existed were the same markup and the same stylesheet copied per
 * view.
 *
 * The copy travels as inputs rather than as projected content: projected nodes keep the consumer's
 * style encapsulation, so a shared stylesheet cannot reach them, and each view would end up
 * restyling the same heading. `i18n-heading` / `i18n-description` translate the attributes, so the
 * text still lives in the template that owns it. Projection is left for the action, which brings
 * its own styling with it.
 */
@Component({
  selector: 'app-empty-state',
  imports: [TuiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--univgo-space-s);
      padding: var(--univgo-space-3xl) var(--univgo-space-l);
      border: 1px dashed var(--tui-border-normal);
      border-radius: var(--tui-radius-l);
      color: var(--tui-text-secondary);
      text-align: center;
    }

    tui-icon {
      font-size: 2rem;
    }

    h2 {
      color: var(--tui-text-primary);
      font: var(--tui-typography-ui-l);
    }

    p {
      margin: 0;
      font: var(--tui-typography-body-s);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--univgo-space-s);
      margin-block-start: var(--univgo-space-s);
    }

    .actions:empty {
      display: none;
    }
  `,
  template: `
    <tui-icon [icon]="icon()" aria-hidden="true" />

    <h2>{{ heading() }}</h2>
    <p>{{ description() }}</p>

    <div class="actions">
      <ng-content />
    </div>
  `,
})
export class EmptyState {
  public readonly icon = input.required<string>();
  public readonly heading = input.required<string>();
  public readonly description = input.required<string>();
}
