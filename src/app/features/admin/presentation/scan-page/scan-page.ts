import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, fromEvent, map } from 'rxjs';
import {
  TuiAppearance,
  TuiButton,
  TuiDialog,
  type TuiDialogOptions,
  TuiInput,
  TuiLoader,
} from '@taiga-ui/core';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { formatTimeRange, minutesOfDay } from '../../../../shared/time/time-of-day';
import { AdminBlockRepository, blockInProgress } from '../../domain/admin-block.repository';
import type { ScanResult } from '../../domain/check-in-scan';
import { CheckInScanner } from '../../domain/check-in.scanner';
import { CheckInResult } from '../check-in-result/check-in-result';
import { QrCamera } from '../qr-camera/qr-camera';

/** Where `.layout` puts the result beside the camera — `bp.$desktop` in `_breakpoints.scss`. Taiga's
 *  own breakpoints step at 768px and 1280px, neither of which is where this layout folds. */
const SIDE_BY_SIDE_QUERY = '(width >= 64rem)';

/**
 * The administrator's main screen (`docs/booking-flow.md` §11: "la pantalla principal y casi la
 * única"). It always checks against the space's block in progress right now — never a picker —
 * because a scan only ever means "let this person in right now" (§9).
 *
 * The space and — when there is one — the block in progress travel with the scan. The server checks
 * the space first, so a code booked for another room is refused here instead of being checked into
 * a roster for a place its owner is not in. Outside opening hours there is no block, and the scan
 * still goes through: the reservation's own window is then the only thing left to decide.
 *
 * The camera and the manual field feed the same verification path, so a code typed by hand gets
 * exactly the same six answers a decoded one would. `lastCameraCode` exists only to stop a QR still
 * sitting in front of the lens from re-triggering a request every frame it stays there; it is not a
 * "seen already" record — switching space or changing what is typed does not need to touch it,
 * because a different code found there naturally clears it by not matching.
 */
@Component({
  selector: 'app-scan-page',
  imports: [
    CheckInResult,
    FormsModule,
    QrCamera,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiDialog,
    TuiInput,
    TuiLoader,
    TuiSurface,
  ],
  templateUrl: './scan-page.html',
  styleUrl: './scan-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanPage {
  public readonly spaceId = input.required<string>();

  private readonly scanner = inject(CheckInScanner);
  private readonly blocks = inject(AdminBlockRepository);
  private readonly sideBySide = inject(DOCUMENT).defaultView?.matchMedia(SIDE_BY_SIDE_QUERY);
  private readonly resultInSight = toSignal(
    this.sideBySide
      ? fromEvent<MediaQueryListEvent>(this.sideBySide, 'change').pipe(
          map((event) => event.matches),
        )
      : EMPTY,
    { initialValue: this.sideBySide?.matches ?? false },
  );

  /** Read once: the door is attended for one session, and a block that moved under the person
   *  scanning would change what a code means halfway through a queue. */
  private readonly now = new Date();

  protected readonly manualCode = signal('');
  protected readonly verifying = signal(false);
  protected readonly result = signal<ScanResult | null>(null);

  protected readonly resultLabel = $localize`:@@admin.scan.result.label:Resultado del escaneo`;

  /**
   * Below desktop the result panel stacks under the camera, out of sight of someone aiming the
   * phone at a student, so each answer is raised as a dialog instead. It also pauses the camera:
   * the next code is read only once the administrator has seen this one and dismissed it.
   */
  protected readonly resultOpen = linkedSignal(
    () => !this.resultInSight() && this.result() !== null,
  );

  protected readonly resultDialogOptions: Partial<TuiDialogOptions<void>> = {
    label: this.resultLabel,
  };

  private lastCameraCode: string | null = null;

  private readonly daySchedule = rxResource({
    params: () => this.spaceId(),
    stream: ({ params }) => this.blocks.blocksOf(params, this.now),
    defaultValue: [],
  });

  protected readonly currentBlock = computed(() =>
    blockInProgress(this.daySchedule.value(), this.now),
  );

  /** What the header says the scanner is checking against, so it is never a guess. */
  protected readonly currentRange = computed(() => {
    const block = this.currentBlock();

    return block ? formatTimeRange(minutesOfDay(block.start), minutesOfDay(block.end)) : null;
  });

  constructor() {
    // The header's switcher rewrites the URL rather than routing to a new instance, so this runs
    // again on every space change, not just once at construction.
    effect(() => {
      this.spaceId();

      this.result.set(null);
      this.lastCameraCode = null;
    });
  }

  protected onCameraCode(code: string): void {
    if (this.verifying() || this.resultOpen() || code === this.lastCameraCode) {
      return;
    }

    this.lastCameraCode = code;
    this.verify(code);
  }

  protected submitManualCode(): void {
    const code = this.manualCode().trim();

    if (!code || this.verifying()) {
      return;
    }

    this.verify(code);
  }

  private verify(code: string): void {
    const block = this.currentBlock();

    this.verifying.set(true);

    this.scanner
      .scan({
        code,
        spaceId: this.spaceId(),
        startMinutes: block ? minutesOfDay(block.start) : null,
        endMinutes: block ? minutesOfDay(block.end) : null,
      })
      .subscribe({
        next: (result) => {
          this.verifying.set(false);
          this.result.set(result);
          this.manualCode.set('');
        },
        // The failure is already announced by the interceptor. The previous answer is cleared
        // because leaving it on screen would read as the verdict for the code just scanned.
        error: () => {
          this.verifying.set(false);
          this.result.set(null);
        },
      });
  }
}
