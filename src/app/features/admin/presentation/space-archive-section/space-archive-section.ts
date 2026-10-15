import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TuiAppearance, TuiButton, TuiDialogService, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { TUI_CONFIRM } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { defaultIfEmpty } from 'rxjs';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ScrollSpySection } from '../../../../shared/scroll-spy/scroll-spy';
import { AdminSpacesStore } from '../../application/admin-spaces.store';
import { AdminSpaceCrudRepository } from '../../domain/admin-space-crud.repository';

/**
 * Level 3: the last stop of a space's settings — taking it out of the catalogue, or bringing an
 * archived one back. It is the only section an archived space's settings keep beside its profile,
 * since everything operational about a space is refused by the server once it is archived.
 *
 * Archiving leaves for the grid: the panel's sections all refuse an archived space, so staying on
 * its settings would strand the administrator on a page whose bar points nowhere. Restoring stays,
 * because the space comes back as something the whole panel can work with again.
 */
@Component({
  selector: 'app-space-archive-section',
  imports: [
    ScrollSpySection,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiIcon,
    TuiLoader,
    TuiSurface,
  ],
  templateUrl: './space-archive-section.html',
  styleUrl: './space-archive-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceArchiveSection {
  public readonly spaceId = input.required<string>();
  public readonly archived = input.required<boolean>();

  /** The space was restored: the page re-reads it. */
  public readonly restored = output<void>();

  private readonly spaces = inject(AdminSpaceCrudRepository);
  private readonly directory = inject(AdminSpacesStore);
  private readonly notifications = inject(NotificationService);
  private readonly dialogs = inject(TuiDialogService);
  private readonly router = inject(Router);

  protected readonly busy = signal(false);

  /**
   * Archiving is the destructive one, so it asks first and says what it affects. It suspends the
   * space's reservations rather than cancelling them — clearing them is a separate, irreversible
   * action — and the count is what makes that concrete before the administrator commits.
   */
  protected archive(): void {
    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        size: 's',
        label: $localize`:@@admin.spaceArchive.confirm.title:¿Archivar este espacio?`,
        data: {
          content: $localize`:@@admin.spaceArchive.confirm.content:Dejará de aparecer en el catálogo y no se podrá reservar. Las reservas que ya existen quedarán suspendidas, no canceladas, y su historial se conserva. Puedes restaurarlo después.`,
          yes: $localize`:@@admin.spaceArchive.confirm.yes:Archivar`,
          no: $localize`:@@admin.spaceArchive.confirm.no:Cancelar`,
          appearance: 'primary-destructive',
        },
      })
      .pipe(defaultIfEmpty(false))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.runArchive();
        }
      });
  }

  protected restore(): void {
    if (this.busy()) {
      return;
    }

    this.busy.set(true);

    this.spaces.restore(this.spaceId()).subscribe({
      next: () => {
        this.busy.set(false);
        this.directory.refresh();
        this.restored.emit();
        this.notifications.success(
          $localize`:@@admin.spaceArchive.restored.summary:Espacio restaurado`,
          $localize`:@@admin.spaceArchive.restored.detail:Vuelve al catálogo. Sigue cerrado hasta que reabras el cierre que creó el archivado.`,
        );
      },
      error: () => this.busy.set(false),
    });
  }

  private runArchive(): void {
    if (this.busy()) {
      return;
    }

    this.busy.set(true);

    this.spaces.archive(this.spaceId()).subscribe({
      next: (suspended) => {
        this.busy.set(false);
        this.directory.refresh();
        this.notifications.success(
          $localize`:@@admin.spaceArchive.archived.summary:Espacio archivado`,
          suspended === 0
            ? $localize`:@@admin.spaceArchive.archived.none:Ya no aparece en el catálogo. No había reservas activas.`
            : $localize`:@@admin.spaceArchive.archived.some:Ya no aparece en el catálogo. ${suspended} reservas quedaron suspendidas.`,
        );
        void this.router.navigate(['/admin', 'spaces']);
      },
      error: () => this.busy.set(false),
    });
  }
}
