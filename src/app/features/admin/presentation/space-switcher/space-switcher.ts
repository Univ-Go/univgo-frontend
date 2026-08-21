import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TuiButton, TuiDataList, TuiDropdown } from '@taiga-ui/core';
import type { CapacityBlock } from '../../domain/attendance';

let nextTriggerId = 0;

/**
 * Level 3: which of the administrator's spaces this page is showing. It sits next to the block
 * heading it controls rather than in the shell — the header's search and the aside's navigation
 * apply to the whole panel session, but which space is open is this page's own state, the way a
 * repository switcher sits under the repository name rather than in a global bar.
 *
 * Built on the trigger-plus-`tuiOption`-list shape `AccountMenu` and `FilterDropdown` already use,
 * so a fourth dropdown doesn't invent a fifth pattern.
 */
@Component({
  selector: 'app-space-switcher',
  imports: [TuiButton, TuiDataList, TuiDropdown],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
    }
  `,
  template: `
    <button
      tuiButton
      type="button"
      appearance="outline"
      size="m"
      [id]="triggerId"
      iconStart="@tui.map-pin"
      iconEnd="@tui.chevron-down"
      [tuiDropdown]="panel"
      [(tuiDropdownOpen)]="open"
      [attr.aria-label]="switcherLabel + ': ' + current()?.spaceName"
    >
      {{ current()?.spaceName }}
    </button>

    <ng-template #panel>
      <tui-data-list [attr.aria-labelledby]="triggerId">
        @for (space of spaces(); track space.spaceId) {
          <button
            tuiOption
            type="button"
            [iconStart]="space.spaceId === selectedId() ? '@tui.check' : null"
            (click)="select(space.spaceId)"
          >
            {{ space.spaceName }}
          </button>
        }
      </tui-data-list>
    </ng-template>
  `,
})
export class SpaceSwitcher {
  public readonly spaces = input.required<readonly CapacityBlock[]>();
  public readonly selectedId = input.required<string>();

  public readonly spaceSelected = output<string>();

  protected readonly triggerId = `space-switcher-trigger-${nextTriggerId++}`;
  protected readonly open = signal(false);
  protected readonly switcherLabel = $localize`:@@admin.spaceSwitcher.label:Cambiar de espacio`;

  protected readonly current = computed(() =>
    this.spaces().find((space) => space.spaceId === this.selectedId()),
  );

  protected select(spaceId: string): void {
    this.open.set(false);
    this.spaceSelected.emit(spaceId);
  }
}
