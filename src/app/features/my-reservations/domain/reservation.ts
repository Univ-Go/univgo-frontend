import type { SpaceCategory } from '../../spaces/domain/space';

export type ReservationStatus = 'upcoming' | 'ongoing' | 'past';

export interface Reservation {
  readonly id: string;
  readonly spaceName: string;
  readonly location: string;
  readonly date: Date;
  readonly time: string;
  readonly status: ReservationStatus;
  readonly category: SpaceCategory;
  readonly rules: readonly string[];
}
