import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { Data } from '@angular/router';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { TuiStepper } from '@taiga-ui/kit';
import { filter, map, startWith } from 'rxjs';
import { SpaceDraftStore } from '../../application/space-draft.store';
import {
  arePhotosComplete,
  isIdentityComplete,
  isSchedulesComplete,
  isUsageComplete,
} from '../../domain/space-draft';

const IDENTITY_STEP = 0;

const WIZARD_PATH = ['/admin', 'spaces', 'new'];

/**
 * Level 1 of the creation wizard: the frame the five steps render inside. It exists so the stepper
 * has one owner instead of one copy per step, and so which step is showing comes from the child
 * route's `data.step` rather than from a signal this component writes — the URL is what the guards
 * enforce, so reading progress from anywhere else would give the stepper a second, disagreeing
 * source of truth.
 *
 * Every step is a `<button tuiStep>`, including the ones that navigate. `TuiStep` styles the first
 * and the last of the row with `:first-of-type` / `:last-of-type`, which match per element *type*,
 * so a row mixing anchors and buttons loses the padding on whichever step ends each type's run — the
 * gap collapses as steps become reachable. One element type keeps the rhythm fixed, and disabling
 * the ones that cannot be reached yet is the whole of "strict forward, free backward".
 *
 * Modelled on `BookingFlowLayout`, which solved all of this once already.
 */
@Component({
  selector: 'app-space-wizard-layout',
  imports: [RouterOutlet, TuiButton, TuiStepper],
  templateUrl: './space-wizard-layout.html',
  styleUrl: './space-wizard-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceWizardLayout {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly draft = inject(SpaceDraftStore);

  /**
   * `startWith` covers the very first render and `NavigationEnd` every step after it. The child's
   * snapshot is read defensively because this component is built *during* activation: entering the
   * wizard from outside leaves the child route existing but not yet given its snapshot, and the
   * navigation that follows immediately fills it in.
   */
  private readonly childData = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map((): Data => this.route.firstChild?.snapshot?.data ?? {}),
    ),
    { requireSync: true },
  );

  private readonly step = computed(() => {
    const step: unknown = this.childData()['step'];

    return typeof step === 'number' ? step : undefined;
  });

  protected readonly activeStep = computed(() => this.step() ?? IDENTITY_STEP);

  /** How far the draft itself allows walking, which is what disables the steps beyond it. */
  private readonly reach = computed(() => {
    if (!isIdentityComplete(this.draft.identity())) {
      return 0;
    }
    if (!isUsageComplete(this.draft.usage())) {
      return 1;
    }
    if (!isSchedulesComplete(this.draft.schedules())) {
      return 2;
    }

    return arePhotosComplete(this.draft.photos()) ? 4 : 3;
  });

  protected reachable(index: number): boolean {
    return index <= this.reach();
  }

  protected stepState(index: number): 'normal' | 'pass' {
    return index < this.activeStep() ? 'pass' : 'normal';
  }

  protected goTo(index: number): void {
    const paths = ['identity', 'usage', 'schedules', 'photos', 'review'];

    void this.router.navigate([...WIZARD_PATH, paths[index]]);
  }

  /** `spaceWizardLeaveGuard` owns the question about losing the draft, so this is a plain trip out. */
  protected cancel(): void {
    void this.router.navigate(['/admin', 'spaces']);
  }
}
