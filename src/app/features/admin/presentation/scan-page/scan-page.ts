import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiAppearance, TuiButton, TuiInput, TuiLoader } from '@taiga-ui/core';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import type { ScanResult } from '../../domain/check-in-scan';
import { logMockCheckInCodes, scanCheckInCode } from '../../infrastructure/mock-check-in-scanner';
import { MOCK_SPACES } from '../../infrastructure/mock-attendance';
import { CheckInResult } from '../check-in-result/check-in-result';
import { QrCamera } from '../qr-camera/qr-camera';
import { SpaceSwitcher } from '../space-switcher/space-switcher';

/**
 * The administrator's main screen (`docs/booking-flow.md` §11: "la pantalla principal y casi la
 * única"). It always checks against the space's block in progress right now — never a picker — the
 * same block `SpaceSwitcher` already resolves for `capacity-page`, because a scan only ever means
 * "let this person in right now" (§9).
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
    SpaceSwitcher,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiInput,
    TuiLoader,
    TuiSurface,
  ],
  templateUrl: './scan-page.html',
  styleUrl: './scan-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanPage {
  protected readonly spaces = MOCK_SPACES;

  protected readonly selectedSpaceId = signal(MOCK_SPACES[0].spaceId);
  protected readonly manualCode = signal('');
  protected readonly verifying = signal(false);
  protected readonly result = signal<ScanResult | null>(null);

  private lastCameraCode: string | null = null;

  constructor() {
    logMockCheckInCodes(this.selectedSpaceId());
  }

  protected selectSpace(spaceId: string): void {
    this.selectedSpaceId.set(spaceId);
    this.result.set(null);
    this.lastCameraCode = null;
    logMockCheckInCodes(spaceId);
  }

  protected onCameraCode(code: string): void {
    if (this.verifying() || code === this.lastCameraCode) {
      return;
    }

    this.lastCameraCode = code;
    void this.verify(code);
  }

  protected submitManualCode(): void {
    const code = this.manualCode().trim();

    if (!code || this.verifying()) {
      return;
    }

    void this.verify(code);
  }

  private async verify(code: string): Promise<void> {
    this.verifying.set(true);

    const result = await scanCheckInCode(code, this.selectedSpaceId());

    this.verifying.set(false);
    this.result.set(result);
    this.manualCode.set('');
  }
}
