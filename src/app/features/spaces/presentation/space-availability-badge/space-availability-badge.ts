import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TuiTime } from '@taiga-ui/cdk';
import type { TuiSizeS, TuiSizeXL } from '@taiga-ui/core/types';
import { TuiBadge } from '@taiga-ui/kit';
import type { SpaceAvailability } from '../../domain/space';

const MILLISECONDS_PER_MINUTE = 60_000;

/**
 * Level 2: the availability flag repeats on every surface that lists a space, so the
 * appearance/icon/text mapping per state lives once here — the counterpart of
 * `ReservationStatusBadge` for the catalogue.
 */
@Component({
  selector: 'app-space-availability-badge',
  imports: [TuiBadge],
  templateUrl: './space-availability-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
    }

    // Opaque pale fill instead of Taiga's translucent status pale, and unconditionally: this badge
    // sits on the card's crimson media plate, where a translucent pill takes the colour underneath
    // and stops being readable. The pale end of each hue also keeps the pill itself visible against
    // the plate, which the status colours at full strength do not. One pill that reads on any
    // surface, so there is no second variant to pick between.
    [tuiBadge] {
      &[data-appearance='positive'] {
        background: var(--univgo-status-positive-fixed);
        color: var(--univgo-on-status-positive-fixed);
      }

      &[data-appearance='warning'] {
        background: var(--univgo-status-warning-fixed);
        color: var(--univgo-on-status-warning-fixed);
      }

      &[data-appearance='neutral'] {
        background: var(--univgo-status-neutral-fixed);
        color: var(--univgo-on-status-neutral-fixed);
      }

      &[data-appearance='negative'] {
        background: var(--univgo-status-negative-fixed);
        color: var(--univgo-on-status-negative-fixed);
      }

      // Taiga tints badge icons through the appearance; the pill is one solid colour now.
      &::before,
      &::after {
        color: currentcolor;
      }
    }
  `,
})
export class SpaceAvailabilityBadge {
  public readonly availability = input.required<SpaceAvailability>();
  public readonly size = input<TuiSizeS | TuiSizeXL>('m');

  /**
   * 24-hour throughout, matching how the rest of the product writes a booking window. Built with
   * the library's own time object rather than by padding numbers by hand.
   */
  protected readonly nextTime = computed(() => {
    const availability = this.availability();

    return availability.kind === 'later'
      ? TuiTime.fromAbsoluteMilliseconds(availability.slot.from * MILLISECONDS_PER_MINUTE).toString(
          'HH:MM',
        )
      : '';
  });
}
