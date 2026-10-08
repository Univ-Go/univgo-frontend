import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TuiAppearance, TuiButton, TuiLoader } from '@taiga-ui/core';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { formatTimeRange } from '../../../../shared/time/time-of-day';
import { AdminSpacesStore } from '../../application/admin-spaces.store';
import { SpaceDraftStore } from '../../application/space-draft.store';
import { windowsOfDay } from '../../domain/space-draft';
import { WEEKDAYS, weekdayLabel } from '../../domain/weekday';

interface DaySummary {
  readonly name: string;
  readonly hours: string;
}

/**
 * Step five: everything together, and the only place that writes.
 *
 * Publishing is a single multipart request — the fields as JSON and the files as the other parts, in
 * the order the administrator arranged them. The server creates the row, derives the photographs and
 * commits in one transaction, so a failure anywhere leaves no space behind rather than a
 * half-configured one in the catalogue.
 *
 * The error path only clears the in-flight flag: the toast is the interceptor's job, and calling
 * `notifications.error` here as well would show two.
 */
@Component({
  selector: 'app-space-wizard-review-page',
  imports: [TuiAppearance, TuiButton, TuiCardLarge, TuiLoader, TuiSurface],
  templateUrl: './space-wizard-review-page.html',
  styleUrl: './space-wizard-review-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceWizardReviewPage {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly adminSpaces = inject(AdminSpacesStore);

  protected readonly draft = inject(SpaceDraftStore);

  protected readonly publishing = signal(false);

  protected readonly week = computed<readonly DaySummary[]>(() => {
    const windows = this.draft.schedules();

    return WEEKDAYS.map((day) => {
      const ofDay = windowsOfDay(windows, day);

      return {
        name: weekdayLabel(day),
        hours:
          ofDay.length === 0
            ? $localize`:@@admin.spaceSchedules.closed:Cerrado`
            : ofDay
                .map((window) => formatTimeRange(window.fromMinutes, window.toMinutes))
                .join(' · '),
      };
    });
  });

  protected readonly photoCount = computed(() => this.draft.photos().length);

  protected editStep(step: string): void {
    void this.router.navigate(['/admin', 'spaces', 'new', step]);
  }

  protected publish(): void {
    if (this.publishing()) {
      return;
    }

    this.publishing.set(true);

    this.draft.publish().subscribe({
      next: (space) => {
        this.publishing.set(false);
        // The grid and the shell's space switcher both read the directory, and a space that was
        // just created has to appear in them without a reload.
        this.adminSpaces.refresh();
        this.notifications.success(
          $localize`:@@admin.spaceWizard.published.summary:Espacio publicado`,
          $localize`:@@admin.spaceWizard.published.detail:Ya aparece en el catálogo y se puede reservar.`,
        );
        void this.router.navigate(['/admin', 'spaces', space.spaceId, 'edit']);
      },
      error: () => this.publishing.set(false),
    });
  }
}
