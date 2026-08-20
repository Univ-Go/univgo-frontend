import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { Data } from '@angular/router';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiActionBar, TuiStepper } from '@taiga-ui/kit';
import { filter, map, startWith } from 'rxjs';
import { ActionBarTheme } from '../../../../shared/action-bar-theme/action-bar-theme';
import { BookingDraftStore } from '../../application/booking-draft.store';

const SPACE_STEP = 0;

const SPACE_STEP_LINK = ['/book', 'space'];

/**
 * Level 1 of the booking flow: the frame the three steps render inside. It exists so that the
 * stepper has one owner instead of one copy per step — and, above all, so that step one can be the
 * catalogue itself: `/spaces` and `/book/space` render the same view, and only the second one is
 * wrapped in this frame, so the catalogue never has to know a flow exists.
 *
 * Which step is showing comes from the child route's `data.step` rather than from a signal this
 * component writes: the URL is what the guards enforce, so reading progress from anywhere else
 * would give the stepper a second, disagreeing source of truth. A child without a step — the
 * outcome screen — hides the stepper, which is what "the flow is over" looks like.
 *
 * Every step is a button, including the ones that navigate: `TuiStep` styles the first and the
 * last of the row with `:first-of-type` / `:last-of-type`, which match per element *type*, so a row
 * mixing anchors and buttons loses the padding on whichever step ends each type's run — the gap
 * collapses as steps become reachable. One element type keeps the rhythm fixed, and disabling the
 * ones that cannot be reached yet is the whole of "strict forward, free backward".
 */
@Component({
  selector: 'app-booking-flow-layout',
  imports: [ActionBarTheme, RouterLink, RouterOutlet, TuiActionBar, TuiButton, TuiIcon, TuiStepper],
  templateUrl: './booking-flow-layout.html',
  styleUrl: './booking-flow-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingFlowLayout {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly draft = inject(BookingDraftStore);

  /**
   * `startWith` covers the very first render, and `NavigationEnd` every step after it. The child's
   * snapshot is read defensively because this component is built *during* activation: when the
   * flow is entered from outside, the child route exists but has not been given its snapshot yet,
   * and the navigation that follows immediately fills it in.
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

  protected readonly inFlow = computed(() => this.step() !== undefined);
  protected readonly activeStep = computed(() => this.step() ?? SPACE_STEP);

  /**
   * Only the step that is picking a space needs the bar; every other step, and the outcome screen
   * that has no step at all, carries its own action.
   */
  protected readonly pendingSpace = computed(() =>
    this.step() === SPACE_STEP ? this.draft.space() : null,
  );

  protected readonly scheduleLink = computed(() => {
    const space = this.draft.space();

    return space ? ['/book', space.id, 'when'] : null;
  });

  protected readonly reviewLink = computed(() => {
    const booking = this.draft.booking();

    return booking ? ['/book', booking.space.id, 'review'] : null;
  });

  protected stepState(index: number): 'normal' | 'pass' {
    return index < this.activeStep() ? 'pass' : 'normal';
  }

  /**
   * Cancelling is a plain trip home: `bookingLeaveGuard` owns the question about losing the
   * booking, so this button and the navigation bar behave identically instead of each carrying
   * its own dialog.
   */
  protected cancel(): void {
    void this.router.navigate(['/home']);
  }

  protected goToSpaceStep(): void {
    void this.router.navigate(SPACE_STEP_LINK);
  }

  protected goTo(link: readonly string[] | null): void {
    if (link) {
      void this.router.navigate(link);
    }
  }
}
