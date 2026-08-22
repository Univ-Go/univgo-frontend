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
  templateUrl: './space-switcher.html',
  styleUrl: './space-switcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-full]': "fullWidth() ? '' : null",
  },
})
export class SpaceSwitcher {
  public readonly spaces = input.required<readonly CapacityBlock[]>();
  public readonly selectedId = input.required<string>();
  /** Stretches the trigger to its container's width, for hosts where the switcher is the whole row. */
  public readonly fullWidth = input(false);

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
