import type { SpaceCategory } from '../../spaces/domain/space';

/**
 * An entry in the taxonomy a space points at. The category is not a field of the space — it belongs
 * to the type — so choosing a type is how a space acquires one. The product lists types; it does not
 * manage them.
 */
export interface SpaceType {
  readonly id: string;
  readonly name: string;
  readonly category: SpaceCategory;
}

/** `position` 0 is the cover. There is no separate cover flag, so reordering is what changes it. */
export interface AdminSpaceImage {
  readonly id: string;
  readonly position: number;
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

/** Minutes from midnight, as everywhere else in the app. `dayOfWeek` is 1 Monday to 7 Sunday. */
export interface ScheduleWindow {
  readonly id: string;
  readonly dayOfWeek: number;
  readonly fromMinutes: number;
  readonly toMinutes: number;
}

/**
 * One row of the panel's space grid. Deliberately not the student catalogue's `Space`: that answers
 * "can I book here on this date" and computes blocks and closures to do it, while the panel asks
 * what a space is configured as. The counts are what let the grid say a space is missing its hours
 * without opening it.
 */
export interface AdminSpaceSummary {
  readonly spaceId: string;
  readonly name: string;
  readonly location: string;
  readonly spaceTypeId: string;
  readonly spaceTypeName: string;
  readonly category: SpaceCategory;
  readonly capacity: number;
  readonly scheduleWindowCount: number;
  readonly imageCount: number;
  /** Null for a space seeded before the CRUD existed; the wizard cannot produce one. */
  readonly coverImageUrl: string | null;
  readonly archived: boolean;
}

/** Everything the edit screen loads at once. */
export interface AdminSpaceDetail extends AdminSpaceSummary {
  readonly description: string;
  readonly rules: readonly string[];
  readonly archivedAt: Date | null;
  readonly schedules: readonly ScheduleWindow[];
  readonly images: readonly AdminSpaceImage[];
}
