import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TuiAppearance, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import type { ScanResult } from '../../domain/check-in-scan';

/**
 * Level 3: the answer to a scan, held on screen until the next one replaces it. Not a transient
 * notification — `docs/booking-flow.md` §11 asks for a response someone can read "at a metre's
 * distance", and an alert that auto-closes in four seconds would vanish exactly while the
 * administrator is still deciding whether to wave the student in.
 *
 * `aria-live="polite"` on the result region so the outcome reaches someone who cannot see the
 * camera feed — or is holding the device angled at the student rather than at themselves — the
 * moment it changes, without the whole page being announced on every scan.
 */
@Component({
  selector: 'app-check-in-result',
  imports: [DatePipe, EmptyState, TuiAppearance, TuiCardLarge, TuiIcon, TuiSurface],
  templateUrl: './check-in-result.html',
  styleUrl: './check-in-result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckInResult {
  public readonly result = input<ScanResult | null>(null);
}
