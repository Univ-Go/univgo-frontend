import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiDay, TuiTime } from '@taiga-ui/cdk';
import { TuiAppearance, TuiButton, TuiDataList, TuiIcon } from '@taiga-ui/core';
import {
  TuiBlock,
  TuiConfirmService,
  TuiInputDate,
  TuiInputTime,
  TuiSelect,
  TuiSwitch,
  TuiTextarea,
} from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { MOCK_SESSION_USER } from '../../../auth/infrastructure/mock-session';
import type { AdminSpace } from '../../domain/attendance';
import type {
  ClosureReason,
  ClosureRecurrence,
  ClosureScope,
  SpaceClosure,
} from '../../domain/space-closure';
import { CLOSURE_REASON_OPTIONS, closureReasonName } from '../closure-reason';
import { SpaceSwitcher } from '../space-switcher/space-switcher';
import { WEEKDAY_OPTIONS } from '../closure-weekday';

let nextFormId = 0;

const MINUTES_PER_HOUR = 60;
const SLOT_MINUTES = MINUTES_PER_HOUR;

/** "Desde" and "hasta" open on different windows: a closure can start as early as the campus opens
 *  but can't end before the first block a student could have used has run, and vice versa at close. */
const START_OPENING_HOUR = 6;
const START_CLOSING_HOUR = 18;
const END_OPENING_HOUR = 8;
const END_CLOSING_HOUR = 20;

function combine(day: TuiDay, time: TuiTime): Date {
  const date = day.toLocalNativeDate();

  date.setHours(time.hours, time.minutes, 0, 0);

  return date;
}

/**
 * Offering the closable half-hours beats asking someone to type one, same reasoning as
 * `bookableTimes` in `SpacesPage`.
 */
function closureTimeOptions(openingHour: number, closingHour: number): readonly TuiTime[] {
  const span = (closingHour - openingHour) * MINUTES_PER_HOUR;

  return Array.from({ length: span / SLOT_MINUTES + 1 }, (_, step) => {
    const minutes = openingHour * MINUTES_PER_HOUR + step * SLOT_MINUTES;

    return new TuiTime(Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR);
  });
}

/**
 * Level 3: registers a new closure for the selected space. `docs/booking-flow.md` §11 asks the panel
 * to be able to cancel a space's reservations "para mantenimiento imprevisto, cierre anticipado o
 * incidencias" — unlike scanning a check-in, that is a local decision with nothing to validate
 * against a real reservation record, so the form writes straight into the page's own closure list
 * rather than staying inert like the roster's check-in action.
 *
 * Confirmation is a Taiga dialog rather than the mockup's static warning line: cancelling every
 * active reservation in the period and notifying students is exactly the kind of consequence
 * `CLAUDE.md` §7 asks to gate behind an explicit confirmation, not a sentence read in passing.
 */
@Component({
  selector: 'app-closure-form',
  imports: [
    DatePipe,
    FormsModule,
    TuiAppearance,
    TuiBlock,
    TuiButton,
    TuiCardLarge,
    TuiDataList,
    TuiIcon,
    TuiInputDate,
    TuiInputTime,
    TuiSelect,
    TuiSurface,
    TuiSwitch,
    TuiTextarea,
    SpaceSwitcher,
  ],
  templateUrl: './closure-form.html',
  styleUrl: './closure-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Unlike `TuiNotificationService`, `TuiConfirmService` is not root-provided: it depends on
  // `TUI_CONFIRM_DIALOG`, whose default renders a generic yes/no dialog, so the service itself is
  // left for the consumer to register rather than assumed global.
  providers: [TuiConfirmService],
})
export class ClosureForm {
  public readonly spaceId = input.required<string>();
  public readonly spaces = input.required<readonly AdminSpace[]>();

  public readonly closureCreated = output<SpaceClosure>();
  public readonly spaceSelected = output<string>();

  private readonly confirm = inject(TuiConfirmService);
  private readonly notifications = inject(NotificationService);

  protected readonly formId = `closure-form-${nextFormId++}`;
  protected readonly reasonOptions = CLOSURE_REASON_OPTIONS;
  protected readonly reasonName = closureReasonName;
  protected readonly weekdayOptions = WEEKDAY_OPTIONS;
  protected readonly startTimeOptions = closureTimeOptions(START_OPENING_HOUR, START_CLOSING_HOUR);
  protected readonly endTimeOptions = closureTimeOptions(END_OPENING_HOUR, END_CLOSING_HOUR);

  /** Read once: reopening the form at 23:59 should not silently move the minimum date. */
  protected readonly today = TuiDay.currentLocal();

  protected readonly date = signal<TuiDay | null>(null);
  protected readonly scope = signal<ClosureScope>('full_day');
  protected readonly startTime = signal<TuiTime | null>(null);
  protected readonly endTime = signal<TuiTime | null>(null);
  protected readonly weekdays = signal<readonly number[]>([]);
  /** A club's weekly slot has no natural end date, so a standing arrangement is the default. */
  protected readonly indefinite = signal(true);
  protected readonly until = signal<TuiDay | null>(null);
  protected readonly reason = signal<ClosureReason | null>(null);
  protected readonly details = signal('');

  private readonly timeRangeValid = computed(() => {
    if (this.scope() === 'full_day') {
      return true;
    }

    const start = this.startTime();
    const end = this.endTime();

    return (
      start !== null &&
      end !== null &&
      start.toAbsoluteMilliseconds() < end.toAbsoluteMilliseconds()
    );
  });

  private readonly recurrenceValid = computed(() => {
    if (this.scope() !== 'recurring') {
      return true;
    }

    return this.weekdays().length > 0 && (this.indefinite() || this.until() !== null);
  });

  protected readonly formValid = computed(
    () =>
      this.date() !== null &&
      this.reason() !== null &&
      this.timeRangeValid() &&
      this.recurrenceValid(),
  );

  protected setScope(scope: ClosureScope): void {
    this.scope.set(scope);
  }

  /** `TuiTime` has no `equals`, and two instances for the same hour are never `===`. */
  protected isStartTime(option: TuiTime): boolean {
    return option.toAbsoluteMilliseconds() === this.startTime()?.toAbsoluteMilliseconds();
  }

  protected isEndTime(option: TuiTime): boolean {
    return option.toAbsoluteMilliseconds() === this.endTime()?.toAbsoluteMilliseconds();
  }

  protected toggleWeekday(value: number): void {
    this.weekdays.update((current) =>
      current.includes(value) ? current.filter((day) => day !== value) : [...current, value],
    );
  }

  protected submit(): void {
    const day = this.date();
    const reason = this.reason();

    if (day === null || reason === null) {
      return;
    }

    this.confirm
      .withConfirm({
        label: $localize`:@@admin.closure.confirm.title:Confirmar cierre del espacio`,
        size: 's',
        data: {
          content: $localize`:@@admin.closure.confirm.body:Se cancelarán todas las reservas activas en este periodo y se notificará de inmediato a los estudiantes afectados vía correo institucional. Esta acción no se puede deshacer.`,
          yes: $localize`:@@admin.closure.confirm.yes:Cerrar espacio`,
          no: $localize`:@@admin.closure.confirm.no:Cancelar`,
          appearance: 'negative',
        },
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.createClosure(day, reason);
        }
      });
  }

  private createClosure(day: TuiDay, reason: ClosureReason): void {
    const scope = this.scope();
    const start = this.startTime();
    const end = this.endTime();

    const recurrence: ClosureRecurrence | null =
      scope === 'recurring' && start !== null && end !== null
        ? {
            weekdays: this.weekdays(),
            startTime: combine(day, start),
            endTime: combine(day, end),
            until: this.indefinite() ? null : (this.until()?.toLocalNativeDate() ?? null),
          }
        : null;

    this.closureCreated.emit({
      id: `closure-${Date.now()}`,
      spaceId: this.spaceId(),
      scope,
      date: day.toLocalNativeDate(),
      start: scope === 'time_block' && start !== null ? combine(day, start) : null,
      end: scope === 'time_block' && end !== null ? combine(day, end) : null,
      recurrence,
      reason,
      details: this.details().trim().length > 0 ? this.details().trim() : null,
      authorizedBy: MOCK_SESSION_USER.name,
    });

    this.notifications.success(
      $localize`:@@admin.closure.created.summary:Espacio cerrado`,
      $localize`:@@admin.closure.created.detail:Las reservas del periodo se cancelaron y se notificó a los estudiantes.`,
    );

    this.resetForm();
  }

  private resetForm(): void {
    this.date.set(null);
    this.scope.set('full_day');
    this.startTime.set(null);
    this.endTime.set(null);
    this.weekdays.set([]);
    this.indefinite.set(true);
    this.until.set(null);
    this.reason.set(null);
    this.details.set('');
  }
}
