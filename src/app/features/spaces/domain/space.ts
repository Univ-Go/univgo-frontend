/**
 * A space is what the catalogue lists and what a reservation is booked for, so the category lives
 * here rather than with the reservation: `my-reservations` reads this type, not the other way round.
 */
export type SpaceCategory = 'sports' | 'study' | 'lab';

/** Declaration order is the order the catalogue groups categories in. */
export const SPACE_CATEGORIES: readonly SpaceCategory[] = ['sports', 'study', 'lab'];

/**
 * A window in which a space can be booked. `from` and `to` are minutes from midnight of `date`,
 * not clock strings: comparing a request against a window is arithmetic, and a string would force
 * every caller to parse before it could answer.
 */
export interface SpaceSlot {
  readonly date: Date;
  readonly from: number;
  readonly to: number;
}

export interface Space {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly category: SpaceCategory;
  readonly capacity: number;
  readonly underMaintenance: boolean;
  readonly freeSlots: readonly SpaceSlot[];
}

/**
 * What the catalogue can answer about a space for a given request. `later` carries the slot whose
 * start time the user is told about, so the view never has to search the slots again.
 */
export type SpaceAvailability =
  | { readonly kind: 'free'; readonly slot: SpaceSlot }
  | { readonly kind: 'later'; readonly slot: SpaceSlot }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'maintenance' };

/**
 * The request the catalogue answers. `date` is always set — the catalogue is about availability, and
 * availability without a day means nothing. `to` is only meaningful alongside `from`: half a range
 * is not a question the catalogue can answer, and the view keeps the pair from being split.
 */
export interface SpaceFilter {
  readonly category: SpaceCategory | null;
  readonly date: Date;
  readonly from: number | null;
  readonly to: number | null;
  /** Free text the user typed; matched against what identifies a space to a person. */
  readonly query: string | null;
}

/**
 * A minute mark a booking could start at on a given day, and whether the space is actually free
 * for the whole booking from there. Unavailable marks travel with the available ones on purpose:
 * a grid that silently drops the busy hours reads as "the space closes at 10", which is a
 * different — and wrong — piece of information.
 */
export interface SpaceStartOption {
  readonly minutes: number;
  readonly available: boolean;
}

export interface ListedSpace {
  readonly space: Space;
  readonly availability: SpaceAvailability;
}

export interface SpaceGroup {
  readonly category: SpaceCategory;
  readonly spaces: readonly ListedSpace[];
}
