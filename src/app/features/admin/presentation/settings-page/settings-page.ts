import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TuiAppearance, TuiButton, TuiDialogService, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { TUI_CONFIRM, TuiBadge, TuiSkeleton, TuiTabs } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { defaultIfEmpty } from 'rxjs';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { ScrollSpy, ScrollSpySection } from '../../../../shared/scroll-spy/scroll-spy';
import { ShellChrome } from '../../../../shared/shell-chrome/shell-chrome';
import { AdminSpaceCrudRepository } from '../../domain/admin-space-crud.repository';
import { AdminSpaceRepository } from '../../domain/admin-space.repository';
import type { SpaceClosure } from '../../domain/space-closure';
import { closuresThisMonth, mostFrequentReasonThisMonth } from '../../domain/space-closure-catalog';
import type { ClosureRequest } from '../../domain/space-closure.repository';
import { SpaceClosureRepository } from '../../domain/space-closure.repository';
import { ClosureForm } from '../closure-form/closure-form';
import { ClosureHistory } from '../closure-history/closure-history';
import { closureReasonName } from '../closure-reason';
import { MetricCard } from '../metric-card/metric-card';
import { SpaceArchiveSection } from '../space-archive-section/space-archive-section';
import { SpaceProfileEditor } from '../space-profile-editor/space-profile-editor';

interface TocEntry {
  /** The section's element id, which `ScrollSpySection` also reports it by. */
  readonly id: string;
  readonly label: string;
  /** Left out for an archived space: the server refuses closures and cancellations on one. */
  readonly activeOnly: boolean;
}

/**
 * From what the space is, to when it is open, to the decisions that cannot be undone: the profile a
 * student reads first, then the weekly hours beside the closures that are their exceptions, then
 * cancelling and retiring. Grouped by what each section is about rather than by how often it is
 * used, so somebody new to the panel can guess where a setting lives before looking.
 */
const TOC: readonly TocEntry[] = [
  { id: 'identity', label: $localize`:@@admin.spaceSection.identity:Identidad`, activeOnly: false },
  { id: 'usage', label: $localize`:@@admin.spaceSection.usage:Uso`, activeOnly: false },
  { id: 'photos', label: $localize`:@@admin.spaceSection.photos:Fotos`, activeOnly: false },
  {
    id: 'schedules',
    label: $localize`:@@admin.spaceSection.schedules:Horarios`,
    activeOnly: false,
  },
  {
    id: 'closures',
    label: $localize`:@@admin.settings.toc.closures:Cierres`,
    activeOnly: true,
  },
  {
    id: 'cancel',
    label: $localize`:@@admin.settings.toc.cancel:Cancelar reservas`,
    activeOnly: true,
  },
  {
    id: 'archive',
    label: $localize`:@@admin.spaceArchive.title:Retirar el espacio`,
    activeOnly: false,
  },
];

/**
 * Everything about one space that is configured rather than operated, on one page with a table of
 * contents: its closures (`docs/booking-flow.md` §11 asks the panel to "cancelar reservas del
 * espacio, para mantenimiento imprevisto, cierre anticipado o incidencias"), what the space is, and
 * retiring it. Editing used to be a separate screen reached from the grid, which gave "where do I
 * change the hours" two answers; it is one now.
 *
 * Two routes serve it. Under `/admin/:spaceId/settings` the space is guaranteed operable. Under
 * `/admin/spaces/:spaceId/edit`, outside that guard, it may be archived — that is where an archived
 * space is restored from — and the page then keeps only what the server still accepts for one: its
 * profile and the way back.
 *
 * A closure suspends rather than cancels (§12), which is what makes reopening possible, and that is
 * why clearing the space's reservations stays a separate, final action further down.
 */
@Component({
  selector: 'app-settings-page',
  imports: [
    ClosureForm,
    ClosureHistory,
    EmptyState,
    MetricCard,
    ScrollSpySection,
    SpaceArchiveSection,
    SpaceProfileEditor,
    TuiAppearance,
    TuiBadge,
    TuiButton,
    TuiIcon,
    TuiCardLarge,
    TuiLoader,
    TuiSkeleton,
    TuiSurface,
    TuiTabs,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ScrollSpy],
  host: {
    // Where the strip pins below desktop: right under the sticky header, whatever height it has.
    '[style.--settings-toc-top.px]': 'chrome.insetBlockStart()',
  },
})
export class SettingsPage {
  public readonly spaceId = input.required<string>();

  private readonly repository = inject(AdminSpaceRepository);
  private readonly crud = inject(AdminSpaceCrudRepository);
  private readonly closureRepository = inject(SpaceClosureRepository);
  private readonly dialogs = inject(TuiDialogService);
  private readonly spy = inject(ScrollSpy);
  protected readonly chrome = inject(ShellChrome);

  private readonly compactToc = viewChild<ElementRef<HTMLElement>>('compactToc');

  protected readonly detail = rxResource({
    params: () => this.spaceId(),
    stream: ({ params }) => this.crud.detail(params),
    defaultValue: undefined,
  });

  /** Unknown until the detail arrives; an archived space never asks for its closures. */
  private readonly operable = computed(() => this.detail.value()?.archived === false);

  protected readonly toc = computed(() =>
    TOC.filter((entry) => this.operable() || !entry.activeOnly),
  );

  protected readonly tocIndex = computed(() =>
    Math.max(
      0,
      this.toc().findIndex((entry) => entry.id === this.spy.active()),
    ),
  );
  private readonly notifications = inject(NotificationService);

  protected readonly cancelling = signal(false);
  protected readonly closing = signal(false);
  protected readonly revertingId = signal<string | null>(null);

  protected readonly closures = rxResource({
    params: () => (this.operable() ? this.spaceId() : undefined),
    stream: ({ params }) => this.closureRepository.closuresOf(params),
    defaultValue: [],
  });

  protected readonly closuresThisMonthCount = computed(() =>
    closuresThisMonth(this.closures.value(), new Date()),
  );

  protected readonly frequentReasonLabel = computed(() => {
    const reason = mostFrequentReasonThisMonth(this.closures.value(), new Date());

    return reason === null
      ? $localize`:@@admin.closure.stats.noReason:Sin cierres`
      : closureReasonName(reason);
  });

  /**
   * The strip below desktop stays pinned over the content, so a section jumped to has to land below
   * it as well as below the header. From desktop the strip is not displayed and measures nothing.
   */
  protected jump(index: number): void {
    const entry = this.toc()[index];

    if (entry) {
      this.spy.jumpTo(entry.id, this.compactToc()?.nativeElement.offsetHeight ?? 0);
    }
  }

  protected close(request: ClosureRequest): void {
    if (this.closing()) {
      return;
    }

    this.closing.set(true);

    this.closureRepository.close(this.spaceId(), request).subscribe({
      next: () => {
        this.closing.set(false);
        this.closures.reload();
        this.notifications.success(
          $localize`:@@admin.closure.created.summary:Espacio cerrado`,
          $localize`:@@admin.closure.created.detail:Las reservas de ese periodo quedan suspendidas y vuelven si lo reabres.`,
        );
      },
      error: () => this.closing.set(false),
    });
  }

  protected revert(closure: SpaceClosure): void {
    if (this.revertingId()) {
      return;
    }

    this.revertingId.set(closure.id);

    this.closureRepository.revert(this.spaceId(), closure.id).subscribe({
      next: () => {
        this.revertingId.set(null);
        this.closures.reload();
        this.notifications.success(
          $localize`:@@admin.closure.reverted.summary:Espacio reabierto`,
          $localize`:@@admin.closure.reverted.detail:Las reservas que estaban suspendidas vuelven a estar en pie.`,
        );
      },
      error: () => this.revertingId.set(null),
    });
  }

  protected confirmCancelAll(): void {
    if (this.cancelling()) {
      return;
    }

    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        size: 's',
        label: $localize`:@@admin.settings.cancelAll.title:¿Cancelar todas las reservas de este espacio?`,
        data: {
          content: $localize`:@@admin.settings.cancelAll.content:Se cancelarán las reservas que no hayan terminado. Los estudiantes las verán como canceladas y podrán reservar en otro sitio.`,
          yes: $localize`:@@admin.settings.cancelAll.confirm:Cancelar las reservas`,
          no: $localize`:@@admin.settings.cancelAll.keep:Dejarlas como están`,
          appearance: 'primary-destructive',
        },
      })
      .pipe(defaultIfEmpty(false))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.cancelAll();
        }
      });
  }

  private cancelAll(): void {
    this.cancelling.set(true);

    this.repository.cancelAllReservations(this.spaceId()).subscribe({
      next: (cancelled) => {
        this.cancelling.set(false);
        this.notifications.success(
          $localize`:@@admin.settings.cancelAll.done:Reservas canceladas`,
          $localize`:@@admin.settings.cancelAll.doneDetail:Cupos liberados: ${cancelled}:count:`,
        );
      },
      error: () => this.cancelling.set(false),
    });
  }
}
