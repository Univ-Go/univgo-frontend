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
import { TuiAppearance, TuiButton, TuiDataList, TuiIcon, TuiLoader } from '@taiga-ui/core';
import {
  TuiBlock,
  TuiConfirmService,
  TuiInputDate,
  TuiInputTime,
  TuiSelect,
  TuiTextarea,
} from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import type { ClosureReason } from '../../domain/space-closure';
import type { ClosureRequest } from '../../domain/space-closure.repository';
import { CLOSURE_REASON_OPTIONS, closureReasonName } from '../closure-reason';

let nextFormId = 0;

const MINUTES_PER_HOUR = 60;
const SLOT_MINUTES = MINUTES_PER_HOUR;

/** "Desde" and "hasta" open on different windows: a closure can start as early as the campus opens
 *  but can't end before the first block a student could have used has run, and vice versa at close. */
const START_OPENING_HOUR = 6;
const START_CLOSING_HOUR = 18;
const END_OPENING_HOUR = 8;
const END_CLOSING_HOUR = 20;

/**
 * How long the closure lasts, which is the one question the form asks that the API does not have a
 * field for: it takes two instants, and these are the three shapes a person actually registers.
 */
type ClosureSpan = 'full_day' | 'time_block' | 'indefinite';

function combine(day: TuiDay, time: TuiTime): Date {
  const date = day.toLocalNativeDate();

  date.setHours(time.hours, time.minutes, 0, 0);

  return date;
}

/**
 * Offering the closable hours beats asking someone to type one, same reasoning as `bookableTimes`
 * in `SpacesPage`.
 */
function closureTimeOptions(openingHour: number, closingHour: number): readonly TuiTime[] {
  const span = (closingHour - openingHour) * MINUTES_PER_HOUR;

  return Array.from({ length: span / SLOT_MINUTES + 1 }, (_, step) => {
    const minutes = openingHour * MINUTES_PER_HOUR + step * SLOT_MINUTES;

    return new TuiTime(Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR);
  });
}

/**
 * Level 3: registers a closure of the selected space (`docs/booking-flow.md` §12). The form only
 * composes the request; sending it and telling the history about it belong to the page, which is
 * what owns both.
 *
 * Confirmation is a Taiga dialog rather than a warning line read in passing, because a closure does
 * take a block away from whoever had booked it. What it says is what actually happens: those
 * reservations are suspended and come back if the closure is reverted — nothing is cancelled, and
 * clearing them is a separate action on the card above.
 *
 * Recurrence is deliberately not here. A weekly slot is a schedule, not an incident, and §12 leaves
 * it out: evaluating repetition rules on every availability read is the highest cost in the section
 * for its least frequent case.
 */
@Component({
  selector: 'app-closure-form',
  imports: [
    FormsModule,
    TuiAppearance,
    TuiBlock,
    TuiButton,
    TuiCardLarge,
    TuiDataList,
    TuiIcon,
    TuiInputDate,
    TuiInputTime,
    TuiLoader,
    TuiSelect,
    TuiSurface,
    TuiTextarea,
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
  /** True while the page is sending the closure, so the form cannot register it twice. */
  public readonly saving = input(false);

  public readonly closureRequested = output<ClosureRequest>();

  private readonly confirm = inject(TuiConfirmService);

  protected readonly formId = `closure-form-${nextFormId++}`;
  protected readonly reasonOptions = CLOSURE_REASON_OPTIONS;
  protected readonly reasonName = closureReasonName;
  protected readonly startTimeOptions = closureTimeOptions(START_OPENING_HOUR, START_CLOSING_HOUR);
  protected readonly endTimeOptions = closureTimeOptions(END_OPENING_HOUR, END_CLOSING_HOUR);

  /** Read once: reopening the form at 23:59 should not silently move the minimum date. */
  protected readonly today = TuiDay.currentLocal();

  protected readonly date = signal<TuiDay | null>(null);
  protected readonly span = signal<ClosureSpan>('full_day');
  protected readonly startTime = signal<TuiTime | null>(null);
  protected readonly endTime = signal<TuiTime | null>(null);
  protected readonly reason = signal<ClosureReason | null>(null);
  protected readonly details = signal('');

  private readonly timeRangeValid = computed(() => {
    if (this.span() !== 'time_block') {
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

  protected readonly formValid = computed(
    () => this.date() !== null && this.reason() !== null && this.timeRangeValid(),
  );

  protected setSpan(span: ClosureSpan): void {
    this.span.set(span);
  }

  /** `TuiTime` has no `equals`, and two instances for the same hour are never `===`. */
  protected isStartTime(option: TuiTime): boolean {
    return option.toAbsoluteMilliseconds() === this.startTime()?.toAbsoluteMilliseconds();
  }

  protected isEndTime(option: TuiTime): boolean {
    return option.toAbsoluteMilliseconds() === this.endTime()?.toAbsoluteMilliseconds();
  }

  protected submit(): void {
    const day = this.date();
    const reason = this.reason();

    if (day === null || reason === null || this.saving()) {
      return;
    }

    this.confirm
      .withConfirm({
        label: $localize`:@@admin.closure.confirm.title:Confirmar cierre del espacio`,
        size: 's',
        data: {
          content: $localize`:@@admin.closure.confirm.body:El espacio dejará de ofrecer los bloques de ese periodo. Las reservas que ya existan quedarán suspendidas: conservan su plaza y vuelven si reabres el espacio.`,
          yes: $localize`:@@admin.closure.confirm.yes:Cerrar espacio`,
          no: $localize`:@@admin.closure.confirm.no:Cancelar`,
          appearance: 'negative',
        },
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.closureRequested.emit(this.requestFrom(day, reason));
          this.resetForm();
        }
      });
  }

  /**
   * The three spans as the two instants the server takes. A full day is the day itself, midnight to
   * midnight; a span with no end date leaves `endsAt` empty and holds until somebody reverts it.
   */
  private requestFrom(day: TuiDay, reason: ClosureReason): ClosureRequest {
    const startOfDay = day.toLocalNativeDate();
    const start = this.startTime();
    const end = this.endTime();
    const details = this.details().trim();

    return {
      startsAt: this.span() === 'time_block' && start !== null ? combine(day, start) : startOfDay,
      endsAt: this.endOf(day, end),
      reason,
      details: details.length > 0 ? details : null,
    };
  }

  private endOf(day: TuiDay, end: TuiTime | null): Date | null {
    if (this.span() === 'indefinite') {
      return null;
    }

    if (this.span() === 'time_block' && end !== null) {
      return combine(day, end);
    }

    return day.append({ day: 1 }).toLocalNativeDate();
  }

  private resetForm(): void {
    this.date.set(null);
    this.span.set('full_day');
    this.startTime.set(null);
    this.endTime.set(null);
    this.reason.set(null);
    this.details.set('');
  }
}
