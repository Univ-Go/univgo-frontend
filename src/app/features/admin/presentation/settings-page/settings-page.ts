import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MOCK_SPACES } from '../../infrastructure/mock-attendance';
import { MOCK_CLOSURES } from '../../infrastructure/mock-closures';
import { closuresThisMonth, mostFrequentReasonThisMonth } from '../../domain/space-closure-catalog';
import type { SpaceClosure } from '../../domain/space-closure';
import { closureReasonName } from '../closure-reason';
import { ClosureForm } from '../closure-form/closure-form';
import { ClosureHistory } from '../closure-history/closure-history';
import { MetricCard } from '../metric-card/metric-card';

/**
 * Visual mock: layout and component inventory are final, the data is not. Reuses `MOCK_SPACES` from
 * the capacity view so switching spaces here lines up with the same three spaces there, and starts
 * from `MOCK_CLOSURES` — the panel's only other hardcoded source, moving behind a port once the
 * closures API exists.
 *
 * `docs/booking-flow.md` §11 asks the panel to be able to "cancelar reservas del espacio, para
 * mantenimiento imprevisto, cierre anticipado o incidencias": this is the fourth and last of the
 * four things the document asks for.
 */
@Component({
  selector: 'app-settings-page',
  imports: [ClosureForm, ClosureHistory, MetricCard],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  protected readonly spaces = MOCK_SPACES;

  /** Page-local, like the capacity view's: the shell has no say in which space this is about. */
  protected readonly selectedSpaceId = signal(MOCK_SPACES[0].spaceId);

  protected readonly closures = signal<readonly SpaceClosure[]>(MOCK_CLOSURES);

  protected readonly spaceClosures = computed(() =>
    this.closures().filter((closure) => closure.spaceId === this.selectedSpaceId()),
  );

  protected readonly closuresThisMonthCount = computed(() =>
    closuresThisMonth(this.spaceClosures(), new Date()),
  );

  protected readonly frequentReasonLabel = computed(() => {
    const reason = mostFrequentReasonThisMonth(this.spaceClosures(), new Date());

    return reason === null
      ? $localize`:@@admin.closure.stats.noReason:Sin cierres`
      : closureReasonName(reason);
  });

  protected selectSpace(spaceId: string): void {
    this.selectedSpaceId.set(spaceId);
  }

  protected addClosure(closure: SpaceClosure): void {
    this.closures.update((current) => [closure, ...current]);
  }
}
