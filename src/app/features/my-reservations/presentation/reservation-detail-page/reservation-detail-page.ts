import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiItem } from '@taiga-ui/cdk';
import { TuiAppearance, TuiButton, TuiDialog, TuiIcon, TuiLink } from '@taiga-ui/core';
import type { TuiDialogOptions } from '@taiga-ui/core';
import { TuiBreadcrumbs } from '@taiga-ui/kit';
import { TuiCardLarge, TuiList, TuiSurface } from '@taiga-ui/layout';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { MediaPlate } from '../../../../shared/media-plate/media-plate';
import { spaceCategoryIcon } from '../../../spaces/presentation/space-category';
import { MOCK_RESERVATIONS } from '../../infrastructure/mock-reservations';
import { ReservationStatusBadge } from '../reservation-status-badge/reservation-status-badge';

/**
 * Visual mock, reading from the same `MOCK_RESERVATIONS` source as the list view — moves to a
 * use case behind a domain port once the booking API exists. `id` is bound from the `:id` route
 * param via `withComponentInputBinding()`, so no `ActivatedRoute` injection is needed here.
 *
 * A missing/unknown id is a real, reachable state (stale link, typed URL) and gets its own empty
 * state rather than a blank page or a thrown error.
 */
@Component({
  selector: 'app-reservation-detail-page',
  imports: [
    DatePipe,
    EmptyState,
    MediaPlate,
    ReservationStatusBadge,
    RouterLink,
    TuiAppearance,
    TuiBreadcrumbs,
    TuiButton,
    TuiCardLarge,
    TuiDialog,
    TuiIcon,
    TuiItem,
    TuiLink,
    TuiList,
    TuiSurface,
  ],
  templateUrl: './reservation-detail-page.html',
  styleUrl: './reservation-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationDetailPage {
  public readonly id = input<string>();

  protected readonly reservation = computed(() =>
    MOCK_RESERVATIONS.find((candidate) => candidate.id === this.id()),
  );

  protected readonly categoryIcon = spaceCategoryIcon;

  protected readonly qrOpen = signal(false);

  /**
   * A screen held out at a reception desk is read at arm's length, so the pass gets the largest
   * dialog size. The directive writes `false` back into `qrOpen` when the dialog closes.
   */
  protected readonly qrDialogOptions: Partial<TuiDialogOptions<void>> = {
    size: 'l',
    label: $localize`:@@reservations.detail.pass.dialogTitle:Código QR de tu reserva`,
  };
}
