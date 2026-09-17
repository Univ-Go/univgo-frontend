import type { Observable } from 'rxjs';
import type { ScanResult } from './check-in-scan';

/**
 * A code read at the door, and the block the administrator is checking people into. The block is
 * what lets the answer be "su reserva es de otro bloque" instead of a flat refusal; without it the
 * server can only judge the reservation against its own window.
 */
export interface ScanRequest {
  readonly code: string;
  readonly startMinutes: number | null;
  readonly endMinutes: number | null;
}

/**
 * Check-in is a write, not a query: a valid scan is what keeps the reservation. It is a port of its
 * own rather than a method on the reservations repository because the panel is the only caller and
 * the student's side must never be able to check itself in.
 */
export abstract class CheckInScanner {
  abstract scan(request: ScanRequest): Observable<ScanResult>;
}
