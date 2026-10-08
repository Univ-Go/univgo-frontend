import { WEEKDAYS } from './weekday';

/**
 * What the creation wizard has collected so far. Every field is optional or empty because the wizard
 * is walked in steps and can be walked backwards: a draft with a name and no photographs is the
 * normal state between step one and step four, not an error. Same shape of problem as
 * `booking-draft.ts`, and solved the same way.
 */
export interface SpaceIdentityDraft {
  readonly name: string;
  readonly location: string;
  readonly spaceTypeId: string | null;
  /** Null while the field is empty; a space is never created with a capacity of zero. */
  readonly capacity: number | null;
}

export interface SpaceUsageDraft {
  readonly description: string;
  /** May be empty: a space whose rules nobody has written yet is a real state, not a fault. */
  readonly rules: readonly string[];
}

/** Minutes from midnight, which is how the rest of the app compares and formats an hour. */
export interface ScheduleWindowDraft {
  readonly dayOfWeek: number;
  readonly fromMinutes: number;
  readonly toMinutes: number;
}

/**
 * A photograph the administrator has picked but not yet sent. The file stays in the browser until
 * the last step, so nothing is uploaded against a space that may never be created.
 *
 * `previewUrl` comes from `URL.createObjectURL`, so whoever drops a photo from the list owns
 * revoking it — otherwise the wizard leaks one blob per abandoned photograph for the life of the
 * tab.
 */
export interface SpacePhotoDraft {
  readonly id: string;
  readonly file: File;
  readonly previewUrl: string;
}

export interface SpaceDraft {
  readonly identity: SpaceIdentityDraft;
  readonly usage: SpaceUsageDraft;
  readonly schedules: readonly ScheduleWindowDraft[];
  readonly photos: readonly SpacePhotoDraft[];
}

/**
 * A draft with everything a space needs to be published, which is the only shape the review step can
 * send. The minimum is not arbitrary: the first five are `NOT NULL` columns, a space without an
 * opening window generates no blocks at all, and one without a photograph reads as unfinished in the
 * catalogue.
 */
export interface PublishableSpaceDraft {
  readonly name: string;
  readonly location: string;
  readonly spaceTypeId: string;
  readonly capacity: number;
  readonly description: string;
  readonly rules: readonly string[];
  readonly schedules: readonly ScheduleWindowDraft[];
  readonly photos: readonly SpacePhotoDraft[];
}

export type ScheduleIssueKind = 'endBeforeStart' | 'duplicate' | 'overlap';

export interface ScheduleIssue {
  readonly index: number;
  readonly kind: ScheduleIssueKind;
}

export const MIN_CAPACITY = 1;

export const MAX_CAPACITY = 1000;

function filled(value: string): boolean {
  return value.trim().length > 0;
}

export function emptyIdentity(): SpaceIdentityDraft {
  return { name: '', location: '', spaceTypeId: null, capacity: null };
}

export function emptyUsage(): SpaceUsageDraft {
  return { description: '', rules: [] };
}

export function isIdentityComplete(identity: SpaceIdentityDraft): boolean {
  return (
    filled(identity.name) &&
    filled(identity.location) &&
    identity.spaceTypeId !== null &&
    identity.capacity !== null &&
    identity.capacity >= MIN_CAPACITY &&
    identity.capacity <= MAX_CAPACITY
  );
}

export function isUsageComplete(usage: SpaceUsageDraft): boolean {
  return filled(usage.description);
}

export function isSchedulesComplete(windows: readonly ScheduleWindowDraft[]): boolean {
  return windows.length > 0 && scheduleIssues(windows).length === 0;
}

export function arePhotosComplete(photos: readonly SpacePhotoDraft[]): boolean {
  return photos.length > 0;
}

export function isPublishable(draft: SpaceDraft): boolean {
  return (
    isIdentityComplete(draft.identity) &&
    isUsageComplete(draft.usage) &&
    isSchedulesComplete(draft.schedules) &&
    arePhotosComplete(draft.photos)
  );
}

/**
 * The gate the wizard is strict about, so "can this be published" is one rule here rather than a
 * condition each guard and each button repeats. Mirrors `scheduleBooking`.
 */
export function publishableDraft(draft: SpaceDraft): PublishableSpaceDraft | null {
  if (!isPublishable(draft)) {
    return null;
  }

  const { name, location, spaceTypeId, capacity } = draft.identity;

  return {
    name: name.trim(),
    location: location.trim(),
    // Narrowed by `isPublishable`; the checks above are what make these non-null.
    spaceTypeId: spaceTypeId as string,
    capacity: capacity as number,
    description: draft.usage.description.trim(),
    rules: draft.usage.rules,
    schedules: draft.schedules,
    photos: draft.photos,
  };
}

/**
 * Why a week of opening windows cannot be saved, per window, so the editor can mark the offending
 * row — a toast cannot say which one.
 *
 * Overlap is rejected and not merely deduplicated because `BlockGenerator` on the server walks a
 * day's windows one by one: two that share a minute generate the blocks between them twice, which is
 * the exact symptom a migration already had to clean up once. Windows that only touch are fine.
 *
 * This mirrors the server's own rule rather than replacing it — the server is the authority, this is
 * so nobody has to round-trip to learn they typed the same hours twice.
 */
export function scheduleIssues(windows: readonly ScheduleWindowDraft[]): readonly ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];

  windows.forEach((window, index) => {
    if (window.toMinutes <= window.fromMinutes) {
      issues.push({ index, kind: 'endBeforeStart' });

      return;
    }

    const kind = clashKind(windows, window, index);

    if (kind) {
      issues.push({ index, kind });
    }
  });

  return issues;
}

function clashKind(
  windows: readonly ScheduleWindowDraft[],
  window: ScheduleWindowDraft,
  index: number,
): ScheduleIssueKind | null {
  let clash: ScheduleIssueKind | null = null;

  windows.forEach((other, otherIndex) => {
    if (otherIndex === index || other.dayOfWeek !== window.dayOfWeek) {
      return;
    }

    if (other.fromMinutes === window.fromMinutes && other.toMinutes === window.toMinutes) {
      clash = 'duplicate';

      return;
    }

    // A shared minute, not a shared boundary: 12:00-14:00 and 14:00-16:00 are two windows.
    if (
      clash === null &&
      window.fromMinutes < other.toMinutes &&
      other.fromMinutes < window.toMinutes
    ) {
      clash = 'overlap';
    }
  });

  return clash;
}

export function windowsOfDay(
  windows: readonly ScheduleWindowDraft[],
  dayOfWeek: number,
): readonly ScheduleWindowDraft[] {
  return [...windows.filter((window) => window.dayOfWeek === dayOfWeek)].sort(
    (left, right) => left.fromMinutes - right.fromMinutes,
  );
}

/**
 * Copies one day's hours over the rest of the week, which is the case the pilot actually has: seven
 * identical days. Without it an administrator fills fourteen time fields by hand.
 */
export function copyDayToWholeWeek(
  windows: readonly ScheduleWindowDraft[],
  dayOfWeek: number,
): readonly ScheduleWindowDraft[] {
  const source = windowsOfDay(windows, dayOfWeek);

  return WEEKDAYS.flatMap((day) => source.map((window) => ({ ...window, dayOfWeek: day })));
}

/** Moves a photograph by one position. Out-of-range moves are no-ops, not errors. */
export function movePhoto(
  photos: readonly SpacePhotoDraft[],
  from: number,
  to: number,
): readonly SpacePhotoDraft[] {
  if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) {
    return photos;
  }

  const reordered = [...photos];
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);

  return reordered;
}

/** Position 0 is the cover, so making one the cover is moving it to the front. */
export function makeCover(
  photos: readonly SpacePhotoDraft[],
  photoId: string,
): readonly SpacePhotoDraft[] {
  return movePhoto(
    photos,
    photos.findIndex((photo) => photo.id === photoId),
    0,
  );
}
