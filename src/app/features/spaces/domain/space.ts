/**
 * A space is what the catalogue lists and what a reservation is booked for, so the category lives
 * here rather than with the reservation: `my-reservations` reads this type, not the other way round.
 */
export type SpaceCategory = 'sports' | 'study' | 'lab';

/** Declaration order is the order the catalogue groups categories in. */
export const SPACE_CATEGORIES: readonly SpaceCategory[] = ['sports', 'study', 'lab'];

/**
 * The backend names categories in its own vocabulary (`SPORTS`, `STUDY`, `LAB`). Translating them
 * here keeps that spelling out of every view, so a change on the server stays a change in one
 * function. An unknown category is not a reason to hide a space: it lands in the widest group.
 */
export function categoryFromName(name: string): SpaceCategory {
  const category = name.toLowerCase() as SpaceCategory;

  return SPACE_CATEGORIES.includes(category) ? category : 'sports';
}

/**
 * Every booking is one campus block of this length. `docs/booking-flow.md` §2 fixes it: a student
 * does not pick a start time, they pick one of the day's fixed two-hour blocks.
 *
 * It lives with the space and not with the booking feature because the catalogue needs it too:
 * "free at ten" means "free long enough to be booked at ten", and a space with twenty minutes left
 * is not an answer to that question.
 */
export const BOOKING_DURATION_MINUTES = 120;

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
  /** Shut right now, whatever day is being asked about: what the panel's switch reports. */
  readonly underMaintenance: boolean;
  /** Whether the space runs any block on the requested day at all. */
  readonly opensOnDate: boolean;
  /** Whether every block it runs that day falls inside a closure. */
  readonly closedOnDate: boolean;
  readonly freeSlots: readonly SpaceSlot[];
  /** Ordered by the backend; the first is the cover shown wherever a space gets one image. */
  readonly images: readonly string[];
  /** What the space says about itself: what it is and what it is for. */
  readonly description: string;
  /**
   * What a student must read before booking, in reading order. Per space and not per category —
   * two courts of the same kind share a taxonomy, not a set of instructions — and written by an
   * administrator, so it is user content like the name and the location: it arrives in one
   * language and does not travel through i18n. Empty when nobody has written them yet, which the
   * views read as "no section" rather than as a fault.
   */
  readonly rules: readonly string[];
}

/**
 * What the catalogue can answer about a space for a given request. `later` carries the slot whose
 * start time the user is told about, so the view never has to search the slots again.
 *
 * The three ways of having nothing free are three answers and not one: a space that does not open
 * that day is a timetable, a shut one is a decision somebody made, and a full one is other students
 * having got there first. Only the last is worth coming back for later the same day.
 */
export type SpaceAvailability =
  | { readonly kind: 'free'; readonly slot: SpaceSlot }
  | { readonly kind: 'later'; readonly slot: SpaceSlot }
  | { readonly kind: 'full' }
  | { readonly kind: 'closed' }
  | { readonly kind: 'notOpen' };

/**
 * The request the catalogue answers. `date` is always set — the catalogue is about availability, and
 * availability without a day means nothing. `from` is a start time, not a range: how long a booking
 * lasts is a rule of the product, not something a person searching should have to state.
 */
export interface SpaceFilter {
  readonly category: SpaceCategory | null;
  readonly date: Date;
  readonly from: number | null;
  /** Free text the user typed; matched against what identifies a space to a person. */
  readonly query: string | null;
}

export interface ListedSpace {
  readonly space: Space;
  readonly availability: SpaceAvailability;
}

export interface SpaceGroup {
  readonly category: SpaceCategory;
  readonly spaces: readonly ListedSpace[];
}
