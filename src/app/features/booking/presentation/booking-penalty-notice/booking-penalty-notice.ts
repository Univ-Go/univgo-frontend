import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TuiNotification, TuiTitle } from '@taiga-ui/core';
import { interval, map } from 'rxjs';
import { formatCountdown } from '../../../../shared/time/countdown';

/** Once a second: the countdown is shown to the second, so anything slower would visibly stall. */
const TICK_MS = 1000;

/**
 * Level 2: why a space cannot be booked right now, and until when. The penalty is the server's
 * decision and this only shows it; the countdown is a reading of the clock, not a rule.
 *
 * `lifted` fires once per penalty, when its end is reached on this device's clock. The owner then
 * asks the server again, which is the authority on whether the penalty is really over.
 */
@Component({
  selector: 'app-booking-penalty-notice',
  imports: [DatePipe, TuiNotification, TuiTitle],
  templateUrl: './booking-penalty-notice.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingPenaltyNotice {
  public readonly penalizedUntil = input.required<Date>();

  public readonly lifted = output<void>();

  private readonly now = toSignal(interval(TICK_MS).pipe(map(() => Date.now())), {
    initialValue: Date.now(),
  });

  protected readonly countdown = computed(() =>
    formatCountdown(this.penalizedUntil().getTime() - this.now()),
  );

  private announcedUntil: number | null = null;

  public constructor() {
    effect(() => {
      const until = this.penalizedUntil().getTime();

      if (until <= this.now() && this.announcedUntil !== until) {
        this.announcedUntil = until;
        this.lifted.emit();
      }
    });
  }
}
