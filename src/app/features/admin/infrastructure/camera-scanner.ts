import { Injectable } from '@angular/core';
import QrScanner from 'qr-scanner';

/**
 * Why the camera never started, collapsed to the two things the operator can actually act on:
 * grant the permission, or fall back to typing the code by hand. `qr-scanner` surfaces the browser's
 * own `getUserMedia` rejection, whose `DOMException.name` is the one place that distinction lives.
 */
export type CameraFailure = 'permissionDenied' | 'unavailable';

export class CameraScannerError extends Error {
  constructor(public readonly reason: CameraFailure) {
    super(reason);
  }
}

/**
 * Thin wrapper around `qr-scanner`'s `QrScanner`, the one place in the codebase that touches
 * `getUserMedia`. Feature-local rather than in `core/`: nothing outside the scanning view reads a
 * camera today, and a transversal port for a single consumer would be an abstraction with one
 * caller.
 */
@Injectable({ providedIn: 'root' })
export class CameraScanner {
  private scanner: QrScanner | null = null;

  async start(video: HTMLVideoElement, onDecode: (code: string) => void): Promise<void> {
    this.scanner = new QrScanner(video, (result) => onDecode(result.data), {
      preferredCamera: 'environment',
      highlightScanRegion: false,
      highlightCodeOutline: false,
      maxScansPerSecond: 5,
    });

    try {
      await this.scanner.start();
    } catch (error) {
      this.scanner.destroy();
      this.scanner = null;
      throw new CameraScannerError(this.classify(error));
    }
  }

  stop(): void {
    this.scanner?.destroy();
    this.scanner = null;
  }

  async hasMultipleCameras(): Promise<boolean> {
    const cameras = await QrScanner.listCameras();

    return cameras.length > 1;
  }

  switchCamera(facingMode: QrScanner.FacingMode): Promise<void> | undefined {
    return this.scanner?.setCamera(facingMode);
  }

  private classify(error: unknown): CameraFailure {
    return error instanceof DOMException && error.name === 'NotAllowedError'
      ? 'permissionDenied'
      : 'unavailable';
  }
}
