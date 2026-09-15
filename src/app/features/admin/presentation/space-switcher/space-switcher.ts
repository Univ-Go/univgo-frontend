import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiDataList, TuiDropdown } from '@taiga-ui/core';
import type { AdminSpace } from '../../domain/attendance';

let nextTriggerId = 0;

/**
 * Level 2: which of the administrator's spaces the panel is currently about. Rendered once, from
 * `AdminHeader` — `docs/booking-flow.md` §11 treats the space as the subject of the whole session,
 * not of one screen, so the control sits in the shell rather than being repeated under each view's
 * own heading.
 *
 * Built on the trigger-plus-`tuiOption`-list shape `AccountMenu` and `FilterDropdown` already use,
 * so a fourth dropdown doesn't invent a fifth pattern. The panel's last item leaves the picker
 * entirely for the spaces grid — the same destination the shell's logo links to — so the escape
 * hatch out of "some space" is available from wherever the switcher already is, not only from the
 * header's far corner.
 */
@Component({
  selector: 'app-space-switcher',
  imports: [RouterLink, TuiButton, TuiDataList, TuiDropdown],
  templateUrl: './space-switcher.html',
  styleUrl: './space-switcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-full]': "fullWidth() ? '' : null",
  },
})
export class SpaceSwitcher {
  public readonly spaces = input.required<readonly AdminSpace[]>();
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
