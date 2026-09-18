import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, type Observable, tap } from 'rxjs';
import { startOfDay } from '../../../shared/time/calendar-day';
import type { Reservation } from '../../my-reservations/domain/reservation';
import { ReservationRepository } from '../../my-reservations/domain/reservation.repository';
import type { Space } from '../../spaces/domain/space';
import type { SpaceBlock } from '../../spaces/domain/space-block';
import { scheduleBooking } from '../domain/booking-draft';

/**
 * The answers the user has given so far, and the one action that turns them into a reservation.
 * Provided by the `/book` route rather than in root, so the whole flow shares one instance and
 * nothing outside it can read a half-finished booking. It does outlive a single visit, though — a
 * route's `providers` injector is cached on the route config rather than destroyed on
 * deactivation — so what starts a clean booking is `bookingRestartGuard`, not leaving the page.
 *
 * Walking backwards keeps everything, which is the point of the store: step one finds its space
 * still chosen and step two its date and hour still filled. Only a change that invalidates a later
 * answer clears it — a different space has different hours, and a different day has different
 * availability, so in both cases the block is dropped rather than silently kept against slots that
 * may not exist.
 */
@Injectable()
export class BookingDraftStore {
  private readonly reservations = inject(ReservationRepository);

  private readonly selectedSpace = signal<Space | null>(null);
  // Bookings are made by day, so the time of day carries no meaning here: normalising on the way
  // in makes "is this the same day the user already picked" a plain equality check.
  private readonly selectedDate = signal(startOfDay(new Date()));
  private readonly selectedBlock = signal<SpaceBlock | null>(null);
  private readonly created = signal<Reservation | null>(null);

  public readonly space = this.selectedSpace.asReadonly();
  public readonly date = this.selectedDate.asReadonly();
  public readonly block = this.selectedBlock.asReadonly();

  /** Set once the server has created the reservation, which is what makes the last step reachable. */
  public readonly reservation = this.created.asReadonly();

  public readonly booking = computed(() =>
    scheduleBooking({
      space: this.selectedSpace(),
      date: this.selectedDate(),
      block: this.selectedBlock(),
    }),
  );

  /**
   * Something a person would be sorry to lose: a choice already made that has not become a
   * reservation yet. It is what decides whether leaving the flow is worth interrupting.
   */
  public readonly hasUnsavedChoice = computed(
    () => this.selectedSpace() !== null && this.created() === null,
  );

  public isSelected(spaceId: string): boolean {
    return this.selectedSpace()?.id === spaceId;
  }

  public selectSpace(space: Space): void {
    if (this.selectedSpace()?.id === space.id) {
      return;
    }

    this.selectedSpace.set(space);
    this.selectedBlock.set(null);
  }

  public setDate(date: Date): void {
    const normalized = startOfDay(date);

    if (normalized.getTime() === this.selectedDate().getTime()) {
      return;
    }

    this.selectedDate.set(normalized);
    this.selectedBlock.set(null);
  }

  public selectBlock(block: SpaceBlock): void {
    this.selectedBlock.set(block);
  }

  /**
   * The booking is sent as the three answers the student gave; everything else about a reservation
   * — its code, its check-in window, its state — is the server's to decide, and what comes back is
   * what the outcome step shows.
   *
   * An incomplete draft cannot reach this: `bookingScheduledGuard` keeps the review step out of
   * reach without one, so completing empty is the unreachable branch rather than an error to
   * report.
   */
  public confirm(): Observable<Reservation> {
    const booking = this.booking();

    if (!booking) {
      return EMPTY;
    }

    return this.reservations
      .create({
        spaceId: booking.space.id,
        date: booking.date,
        startMinutes: booking.startMinutes,
      })
      .pipe(tap((reservation) => this.created.set(reservation)));
  }

  /** Back to an empty draft, which is what starting another booking means. */
  public reset(): void {
    this.selectedSpace.set(null);
    this.selectedDate.set(startOfDay(new Date()));
    this.selectedBlock.set(null);
    this.created.set(null);
  }
}
