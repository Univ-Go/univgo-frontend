import type {
  ListedSpace,
  Space,
  SpaceAvailability,
  SpaceFilter,
  SpaceGroup,
  SpaceSlot,
  SpaceStartOption,
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
 * The day's booking grid: every minute mark a booking of `durationMinutes` could start at, spaced
 * `stepMinutes` apart, from the first free window of the day to the last, each flagged with whether
 * the space is free for the whole booking from there. A window shorter than the requested duration
 * offers nothing, and a booking cannot span two separate windows — the same rule
 * `resolveAvailability` applies.
 *
 * A space under maintenance has no grid at all: the slots on record describe when it would open,
 * not when it can be booked.
 */
export function listStartOptions(
  space: Space,
  date: Date,
  durationMinutes: number,
  stepMinutes: number,
): readonly SpaceStartOption[] {
  const slots = slotsOn(space, date);
  const opening = slots[0]?.from;
  const closing = slots.at(-1)?.to;

  if (space.underMaintenance || opening === undefined || closing === undefined) {
    return [];
  }

  const options: SpaceStartOption[] = [];

  for (let start = opening; start + durationMinutes <= closing; start += stepMinutes) {
    options.push({
      minutes: start,
      available: slots.some((slot) => slot.from <= start && slot.to >= start + durationMinutes),
    });
  }

  return options;
}

/**
 * Searching for "basquetbol" has to find "Cancha de Básquetbol A": on a Spanish catalogue an accent
 * is a spelling detail, not a different word, and nobody reaches for the accent key to search.
 */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

/**
 * A space is looked for by the two things a person can name: what it is called and where it is.
 * Every term has to match one of them, so "cancha norte" narrows rather than widens — typing more
 * is how a person expects to search less.
 */
function matchesQuery(space: Space, query: string | null): boolean {
  if (!query?.trim()) {
    return true;
  }

  const haystack = fold(`${space.name} ${space.location}`);

  return fold(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
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
    .filter((space) => matchesQuery(space, filter.query))
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
/**
 * How many narrowings are on, ignoring the typed query — that one has its own field on screen and
 * says so by itself. Behind a collapsed panel the count is the only thing telling a person the
 * catalogue is answering a narrower question than they think.
 */
export function countActiveFilters(filter: SpaceFilter, today: Date): number {
  return (
    Number(filter.category !== null) +
    Number(filter.from !== null) +
    Number(!isSameDay(filter.date, today))
  );
}

export function isFilterActive(filter: SpaceFilter, today: Date): boolean {
  return (
    filter.category !== null ||
    filter.from !== null ||
    Boolean(filter.query?.trim()) ||
    !isSameDay(filter.date, today)
  );
}
