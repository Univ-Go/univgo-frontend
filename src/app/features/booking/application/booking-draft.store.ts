import { Injectable, computed, signal } from '@angular/core';
import type { Space } from '../../spaces/domain/space';
import { scheduleBooking } from '../domain/booking-draft';
import { createReservationCode } from '../infrastructure/mock-reservation-code';

/**
 * Bookings are made by day, so the time of day carries no meaning here. Normalising on the way in
 * makes "is this the same day the user already picked" a plain equality check instead of a
 * comparison every caller would have to remember to make.
 */
function startOfDay(date: Date): Date {
  const normalized = new Date(date);

  normalized.setHours(0, 0, 0, 0);

  return normalized;
}

/**
 * The answers the user has given so far. Provided by the `/book` route rather than in root, so the
 * whole flow shares one instance and nothing outside it can read a half-finished booking. It does
 * outlive a single visit, though — a route's `providers` injector is cached on the route config
 * rather than destroyed on deactivation — so what starts a clean booking is `bookingRestartGuard`,
 * not leaving the page.
 *
 * Walking backwards keeps everything, which is the point of the store: step one finds its space
 * still chosen and step two its date and hour still filled. Only a change that invalidates a later
 * answer clears it — a different space has different hours, and a different day has different
 * availability, so in both cases the hour is dropped rather than silently kept against slots that
 * may not exist.
 */
@Injectable()
export class BookingDraftStore {
  private readonly selectedSpace = signal<Space | null>(null);
  private readonly selectedDate = signal(startOfDay(new Date()));
  private readonly selectedStart = signal<number | null>(null);
  private readonly createdCode = signal<string | null>(null);

  public readonly space = this.selectedSpace.asReadonly();
  public readonly date = this.selectedDate.asReadonly();
  public readonly startMinutes = this.selectedStart.asReadonly();

  /** Set once the reservation has been created, which is what makes the flow's last step reachable. */
  public readonly reservationCode = this.createdCode.asReadonly();

  public readonly booking = computed(() =>
    scheduleBooking({
      space: this.selectedSpace(),
      date: this.selectedDate(),
      startMinutes: this.selectedStart(),
    }),
  );

  /**
   * Something a person would be sorry to lose: a choice already made that has not become a
   * reservation yet. It is what decides whether leaving the flow is worth interrupting.
   */
  public readonly hasUnsavedChoice = computed(
    () => this.selectedSpace() !== null && this.createdCode() === null,
  );

  public isSelected(spaceId: string): boolean {
    return this.selectedSpace()?.id === spaceId;
  }

  public selectSpace(space: Space): void {
    if (this.selectedSpace()?.id === space.id) {
      return;
    }

    this.selectedSpace.set(space);
    this.selectedStart.set(null);
  }

  public setDate(date: Date): void {
    const normalized = startOfDay(date);

    if (normalized.getTime() === this.selectedDate().getTime()) {
      return;
    }

    this.selectedDate.set(normalized);
    this.selectedStart.set(null);
  }

  public setStartMinutes(minutes: number): void {
    this.selectedStart.set(minutes);
  }

  public confirm(): void {
    if (this.booking()) {
      this.createdCode.set(createReservationCode());
    }
  }

  /** Back to an empty draft, which is what starting another booking means. */
  public reset(): void {
    this.selectedSpace.set(null);
    this.selectedDate.set(startOfDay(new Date()));
    this.selectedStart.set(null);
    this.createdCode.set(null);
  }
}
