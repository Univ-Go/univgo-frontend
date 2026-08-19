import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiCheckbox } from '@taiga-ui/core';
import { TuiBlock } from '@taiga-ui/kit';
import { FilterDropdown } from '../filter-dropdown/filter-dropdown';

export interface CheckboxFilterOption<T> {
  readonly value: T;
  readonly label: string;
}

export interface CheckboxFilterChange<T> {
  readonly value: T;
  readonly checked: boolean;
}

/**
 * Level 2: a filter whose options are ticked off a list. The options arrive as data rather than as
 * markup, so they can be enumerated from the domain: a value added there cannot go missing from the
 * filter while still being counted against it.
 *
 * "Narrowing anything down" means any option left out — including all of them, where the list
 * legitimately comes back empty.
 *
 * `FormsModule` is here for `[ngModel]`: `TuiCheckbox` disables itself whenever it has no
 * `NgControl` attached, so a plain `[checked]`/`(change)` pair renders inert.
 */
@Component({
  selector: 'app-checkbox-filter',
  imports: [FilterDropdown, FormsModule, TuiBlock, TuiCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
    }

    label[tuiBlock] {
      display: flex;
      align-items: center;
      gap: var(--univgo-space-xs);
      inline-size: auto;
    }
  `,
  template: `
    <app-filter-dropdown [label]="label()" [active]="active()">
      @for (option of options(); track option.value) {
        <label tuiBlock>
          <input
            type="checkbox"
            tuiCheckbox
            [ngModel]="selected().has(option.value)"
            (ngModelChange)="toggled.emit({ value: option.value, checked: $event })"
          />
          <span>{{ option.label }}</span>
        </label>
      }
    </app-filter-dropdown>
  `,
})
export class CheckboxFilter<T> {
  public readonly label = input.required<string>();
  public readonly options = input.required<readonly CheckboxFilterOption<T>[]>();
  public readonly selected = input.required<ReadonlySet<T>>();

  public readonly toggled = output<CheckboxFilterChange<T>>();

  protected readonly active = computed(() => this.selected().size < this.options().length);
}
