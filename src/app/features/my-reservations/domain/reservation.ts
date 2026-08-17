export type ReservationStatus = 'upcoming' | 'ongoing' | 'past';

export type SpaceCategory = 'sports' | 'study' | 'lab';

export interface Reservation {
  readonly id: string;
  readonly spaceName: string;
  readonly date: Date;
  readonly time: string;
  readonly status: ReservationStatus;
  readonly category: SpaceCategory;
}
