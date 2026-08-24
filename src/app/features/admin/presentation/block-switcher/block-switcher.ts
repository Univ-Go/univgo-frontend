import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TuiButton, TuiDataList, TuiDropdown } from '@taiga-ui/core';
import type { CapacityBlock } from '../../domain/attendance';

let nextTriggerId = 0;

/**
 * Level 3: which of the selected space's blocks this page is showing. `docs/booking-flow.md` §11
 * asks the panel to let an administrator "consultar otros bloques… para responder preguntas y
 * preparar el turno siguiente" — this is that, folded into the same view rather than a separate one,
 * since the block it defaults to is just one entry in the list it already renders.
 *
 * Same trigger-plus-`tuiOption`-list shape as `SpaceSwitcher`, next to which it sits: a fifth
 * dropdown reusing a shape three others already established, not inventing a sixth.
 */
@Component({
  selector: 'app-block-switcher',
  imports: [DatePipe, TuiButton, TuiDataList, TuiDropdown],
  templateUrl: './block-switcher.html',
  styleUrl: './block-switcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockSwitcher {
  public readonly blocks = input.required<readonly CapacityBlock[]>();
  /** Epoch milliseconds rather than a `Date`: stable equality without a `TuiTime`-style comparator. */
  public readonly selectedStart = input.required<number>();

  public readonly blockSelected = output<number>();

  protected readonly triggerId = `block-switcher-trigger-${nextTriggerId++}`;
  protected readonly open = signal(false);
  protected readonly switcherLabel = $localize`:@@admin.blockSwitcher.label:Cambiar de bloque horario`;

  protected readonly current = computed(() =>
    this.blocks().find((block) => block.start.getTime() === this.selectedStart()),
  );

  protected select(start: number): void {
    this.open.set(false);
    this.blockSelected.emit(start);
  }
}
