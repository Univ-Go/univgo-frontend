import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import type QrScanner from 'qr-scanner';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { CameraScanner, CameraScannerError } from '../../infrastructure/camera-scanner';

/** What the frame is showing right now, driving both the overlay and the corner brackets. */
export type QrCameraState = 'starting' | 'scanning' | 'permissionDenied' | 'unavailable';

/**
 * Level 2: the camera half of the scanner. Everything that talks to `getUserMedia` lives in
 * `CameraScanner` (`infrastructure/camera-scanner.ts`); this component only owns the `<video>`
 * element the library needs and the four states that element can be in.
 *
 * Failure is shown inline rather than as a transient notification: an empty camera panel with no
 * explanation would leave the administrator guessing whether it is still starting, and the manual
 * entry underneath is the actual way out, not something a toast that fades in four seconds can
 * point them to.
 */
@Component({
  selector: 'app-qr-camera',
  imports: [EmptyState, TuiButton],
  templateUrl: './qr-camera.html',
  styleUrl: './qr-camera.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCamera {
  private readonly camera = inject(CameraScanner);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  protected readonly state = signal<QrCameraState>('starting');
  protected readonly hasMultipleCameras = signal(false);
  private facingMode: QrScanner.FacingMode = 'environment';

  public readonly codeScanned = output<string>();

  constructor() {
    afterNextRender(() => {
      this.destroyRef.onDestroy(() => this.camera.stop());
      void this.startCamera();
    });
  }

  protected retry(): void {
    this.state.set('starting');
    void this.startCamera();
  }

  protected switchCamera(): void {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    void this.camera.switchCamera(this.facingMode);
  }

  private async startCamera(): Promise<void> {
    try {
      await this.camera.start(this.video().nativeElement, (code) => this.codeScanned.emit(code));
      this.state.set('scanning');
      this.hasMultipleCameras.set(await this.camera.hasMultipleCameras());
    } catch (error) {
      this.state.set(
        error instanceof CameraScannerError && error.reason === 'permissionDenied'
          ? 'permissionDenied'
          : 'unavailable',
      );
    }
  }
}
