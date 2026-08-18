import type {
  ListedSpace,
  Space,
  SpaceAvailability,
  SpaceFilter,
  SpaceGroup,
  SpaceSlot,
} from './space';
import { SPACE_CATEGORIES } from './space';

/** Availability decides the reading order: what can be booked now comes before what cannot. */
const AVAILABILITY_RANK: Readonly<Record<SpaceAvailability['kind'], number>> = {
  free: 0,
  later: 1,
  unavailable: 2,
  maintenance: 3,
};

function isSameDay(one: Date, other: Date): boolean {
  return (
    one.getFullYear() === other.getFullYear() &&
    one.getMonth() === other.getMonth() &&
    one.getDate() === other.getDate()
  );
}

function slotsOn(space: Space, date: Date): readonly SpaceSlot[] {
  return space.freeSlots
    .filter((slot) => isSameDay(slot.date, date))
    .sort((one, other) => one.from - other.from);
}

/**
 * A slot answers the request only when it covers the whole window: a booking cannot span two
 * separate free windows. Without a start time the request is "some time that day", which the
 * earliest slot answers. A `to` that is not after `from` is not a window, so it is ignored and the
 * request degrades to "free at `from`" — the view reports that back instead of silently widening it.
 */
export function resolveAvailability(space: Space, filter: SpaceFilter): SpaceAvailability {
  if (space.underMaintenance) {
    return { kind: 'maintenance' };
  }

  const slots = slotsOn(space, filter.date);
  const [earliest] = slots;

  if (!earliest) {
    return { kind: 'unavailable' };
  }

  if (filter.from === null) {
    return { kind: 'free', slot: earliest };
  }

  const start = filter.from;
  const end = filter.to !== null && filter.to > start ? filter.to : start + 1;
  const match = slots.find((slot) => slot.from <= start && slot.to >= end);

  if (match) {
    return { kind: 'free', slot: match };
  }

  return { kind: 'later', slot: slots.find((slot) => slot.from > start) ?? earliest };
}

/**
 * Every minute mark a booking of `durationMinutes` could start at and still fit inside one of the
 * space's free windows on `date`, spaced `stepMinutes` apart. A window shorter than the requested
 * duration contributes nothing — the same rule `resolveAvailability` applies: a booking cannot span
 * two separate windows.
 */
export function availableStartMinutes(
  space: Space,
  date: Date,
  durationMinutes: number,
  stepMinutes: number,
): readonly number[] {
  return slotsOn(space, date).flatMap((slot) => {
    const starts: number[] = [];

    for (let start = slot.from; start + durationMinutes <= slot.to; start += stepMinutes) {
      starts.push(start);
    }

    return starts;
  });
}

/**
 * Category narrows what is listed at all; a time window narrows it further, because asking for an
 * hour is asking to book then and anything that cannot answer is noise. A date on its own never
 * hides a space — it re-reads availability, so a space with nothing left that day still shows,
 * ranked last, rather than vanishing without explanation.
 */
export function listSpaces(spaces: readonly Space[], filter: SpaceFilter): readonly ListedSpace[] {
  return spaces
    .filter((space) => filter.category === null || space.category === filter.category)
    .map((space) => ({ space, availability: resolveAvailability(space, filter) }))
    .filter((listed) => filter.from === null || listed.availability.kind === 'free')
    .sort(
      (one, other) =>
        AVAILABILITY_RANK[one.availability.kind] - AVAILABILITY_RANK[other.availability.kind] ||
        one.space.name.localeCompare(other.space.name),
    );
}

export function groupByCategory(listed: readonly ListedSpace[]): readonly SpaceGroup[] {
  return SPACE_CATEGORIES.map((category) => ({
    category,
    spaces: listed.filter((entry) => entry.space.category === category),
  })).filter((group) => group.spaces.length > 0);
}

/**
 * Today with no further narrowing is the resting state, not a query: it is what the catalogue shows
 * when nobody has asked for anything, which is what tells the view to browse by category instead of
 * listing results.
 */
export function isFilterActive(filter: SpaceFilter, today: Date): boolean {
  return filter.category !== null || filter.from !== null || !isSameDay(filter.date, today);
}
