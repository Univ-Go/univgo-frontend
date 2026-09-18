import type { Observable } from 'rxjs';
import type { ScanResult } from './check-in-scan';

/**
 * A code read at the door: which door, and which block that door is running right now. The space is
 * what the server checks the reservation against first — a code booked for another room must never
 * validate here — and the block is what turns "not this hour" into an answer instead of a refusal.
 */
export interface ScanRequest {
  readonly code: string;
  readonly spaceId: string;
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
