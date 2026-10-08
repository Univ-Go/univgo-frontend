import { describe, expect, it } from 'vitest';
import {
  type ScheduleWindowDraft,
  type SpaceDraft,
  type SpacePhotoDraft,
  arePhotosComplete,
  copyDayToWholeWeek,
  isIdentityComplete,
  isPublishable,
  isSchedulesComplete,
  isUsageComplete,
  makeCover,
  movePhoto,
  publishableDraft,
  scheduleIssues,
  windowsOfDay,
} from './space-draft';

const TYPE_ID = 'f2c0f3d4-0000-4000-8000-000000000001';

function window(dayOfWeek: number, fromHour: number, toHour: number): ScheduleWindowDraft {
  return { dayOfWeek, fromMinutes: fromHour * 60, toMinutes: toHour * 60 };
}

function photo(id: string): SpacePhotoDraft {
  return { id, file: new File([''], `${id}.jpg`), previewUrl: `blob:${id}` };
}

function draft(overrides: Partial<SpaceDraft> = {}): SpaceDraft {
  return {
    identity: {
      name: 'Gimnasio',
      location: 'Complejo central',
      spaceTypeId: TYPE_ID,
      capacity: 30,
    },
    usage: { description: 'Sala de musculación.', rules: [] },
    schedules: [window(1, 6, 22)],
    photos: [photo('a')],
    ...overrides,
  };
}

describe('identity completeness', () => {
  it('accepts a fully answered identity', () => {
    expect(isIdentityComplete(draft().identity)).toBe(true);
  });

  it('rejects a name that is only whitespace', () => {
    expect(isIdentityComplete({ ...draft().identity, name: '   ' })).toBe(false);
  });

  it('rejects a missing type', () => {
    expect(isIdentityComplete({ ...draft().identity, spaceTypeId: null })).toBe(false);
  });

  it('rejects a capacity nobody could book', () => {
    expect(isIdentityComplete({ ...draft().identity, capacity: 0 })).toBe(false);
  });

  it('rejects a capacity beyond the allowed ceiling', () => {
    expect(isIdentityComplete({ ...draft().identity, capacity: 1001 })).toBe(false);
  });
});

describe('usage completeness', () => {
  it('needs a description', () => {
    expect(isUsageComplete({ description: '  ', rules: [] })).toBe(false);
  });

  it('does not need rules, because a space may have none', () => {
    expect(isUsageComplete({ description: 'Una sala.', rules: [] })).toBe(true);
  });
});

describe('schedule issues', () => {
  it('accepts disjoint windows on the same day', () => {
    expect(scheduleIssues([window(1, 6, 12), window(1, 14, 22)])).toEqual([]);
  });

  it('accepts windows that only touch', () => {
    expect(scheduleIssues([window(1, 12, 14), window(1, 14, 16)])).toEqual([]);
  });

  it('accepts identical hours on different days', () => {
    expect(scheduleIssues([window(1, 6, 22), window(2, 6, 22)])).toEqual([]);
  });

  it('reports a window that ends before it starts', () => {
    expect(scheduleIssues([window(1, 22, 6)])).toEqual([{ index: 0, kind: 'endBeforeStart' }]);
  });

  it('reports a window with no duration', () => {
    expect(scheduleIssues([window(1, 10, 10)])).toEqual([{ index: 0, kind: 'endBeforeStart' }]);
  });

  it('reports an exact duplicate on both rows', () => {
    expect(scheduleIssues([window(1, 6, 22), window(1, 6, 22)])).toEqual([
      { index: 0, kind: 'duplicate' },
      { index: 1, kind: 'duplicate' },
    ]);
  });

  it('reports a partial overlap', () => {
    expect(scheduleIssues([window(3, 6, 12), window(3, 10, 22)])).toEqual([
      { index: 0, kind: 'overlap' },
      { index: 1, kind: 'overlap' },
    ]);
  });

  it('reports a window contained in another', () => {
    expect(scheduleIssues([window(5, 6, 22), window(5, 10, 12)])).toEqual([
      { index: 0, kind: 'overlap' },
      { index: 1, kind: 'overlap' },
    ]);
  });

  it('prefers the malformed reason over a clash on the same row', () => {
    expect(scheduleIssues([window(1, 22, 6), window(1, 6, 22)])).toEqual([
      { index: 0, kind: 'endBeforeStart' },
    ]);
  });
});

describe('schedule completeness', () => {
  it('rejects an empty week, which would offer no blocks at all', () => {
    expect(isSchedulesComplete([])).toBe(false);
  });

  it('rejects a week with an overlap', () => {
    expect(isSchedulesComplete([window(1, 6, 12), window(1, 10, 22)])).toBe(false);
  });

  it('accepts a valid week', () => {
    expect(isSchedulesComplete([window(1, 6, 22)])).toBe(true);
  });
});

describe('windows of a day', () => {
  it('returns only that day, sorted by start time', () => {
    const windows = [window(2, 14, 16), window(1, 8, 10), window(2, 6, 8)];

    expect(windowsOfDay(windows, 2)).toEqual([window(2, 6, 8), window(2, 14, 16)]);
  });
});

describe('copying a day to the whole week', () => {
  it('gives every weekday the source day hours', () => {
    const copied = copyDayToWholeWeek([window(1, 6, 22)], 1);

    expect(copied).toHaveLength(7);
    expect(copied.map((entry) => entry.dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(copied.every((entry) => entry.fromMinutes === 360 && entry.toMinutes === 1320)).toBe(
      true,
    );
  });

  it('copies every window of that day, not just the first', () => {
    const copied = copyDayToWholeWeek([window(1, 6, 12), window(1, 14, 22)], 1);

    expect(copied).toHaveLength(14);
  });

  it('replaces whatever the other days had, so the week really is identical', () => {
    const copied = copyDayToWholeWeek([window(1, 6, 22), window(3, 8, 10)], 1);

    expect(copied.filter((entry) => entry.dayOfWeek === 3)).toEqual([window(3, 6, 22)]);
  });
});

describe('photo ordering', () => {
  const photos = [photo('a'), photo('b'), photo('c')];

  it('moves a photograph up', () => {
    expect(movePhoto(photos, 2, 1).map((entry) => entry.id)).toEqual(['a', 'c', 'b']);
  });

  it('moves a photograph down', () => {
    expect(movePhoto(photos, 0, 1).map((entry) => entry.id)).toEqual(['b', 'a', 'c']);
  });

  it('ignores a move off either end', () => {
    expect(movePhoto(photos, 0, -1)).toBe(photos);
    expect(movePhoto(photos, 2, 3)).toBe(photos);
  });

  it('makes a photograph the cover by moving it to the front', () => {
    expect(makeCover(photos, 'c').map((entry) => entry.id)).toEqual(['c', 'a', 'b']);
  });

  it('leaves the list alone for an id it does not hold', () => {
    expect(makeCover(photos, 'zzz')).toBe(photos);
  });
});

describe('photo completeness', () => {
  it('needs at least one photograph', () => {
    expect(arePhotosComplete([])).toBe(false);
    expect(arePhotosComplete([photo('a')])).toBe(true);
  });
});

describe('publishable draft', () => {
  it('trims the text it sends', () => {
    const publishable = publishableDraft(
      draft({
        identity: {
          name: '  Gimnasio  ',
          location: ' Bloque B ',
          spaceTypeId: TYPE_ID,
          capacity: 30,
        },
        usage: { description: '  Una sala.  ', rules: [] },
      }),
    );

    expect(publishable?.name).toBe('Gimnasio');
    expect(publishable?.location).toBe('Bloque B');
    expect(publishable?.description).toBe('Una sala.');
  });

  it('is null while any step is unanswered', () => {
    expect(publishableDraft(draft({ photos: [] }))).toBeNull();
    expect(publishableDraft(draft({ schedules: [] }))).toBeNull();
    expect(publishableDraft(draft({ usage: { description: '', rules: [] } }))).toBeNull();
  });

  it('agrees with isPublishable', () => {
    expect(isPublishable(draft())).toBe(true);
    expect(publishableDraft(draft())).not.toBeNull();
  });
});
