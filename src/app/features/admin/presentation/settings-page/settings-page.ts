import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MOCK_CLOSURES } from '../../infrastructure/mock-closures';
import { closuresThisMonth, mostFrequentReasonThisMonth } from '../../domain/space-closure-catalog';
import type { SpaceClosure } from '../../domain/space-closure';
import { closureReasonName } from '../closure-reason';
import { ClosureForm } from '../closure-form/closure-form';
import { ClosureHistory } from '../closure-history/closure-history';
import { MetricCard } from '../metric-card/metric-card';

/**
 * Visual mock: layout and component inventory are final, the data is not. Starts from
 * `MOCK_CLOSURES` — the panel's only other hardcoded source, moving behind a port once the closures
 * API exists.
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
  public readonly spaceId = input.required<string>();

  protected readonly closures = signal<readonly SpaceClosure[]>(MOCK_CLOSURES);

  protected readonly spaceClosures = computed(() =>
    this.closures().filter((closure) => closure.spaceId === this.spaceId()),
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

  protected addClosure(closure: SpaceClosure): void {
    this.closures.update((current) => [closure, ...current]);
  }
}
