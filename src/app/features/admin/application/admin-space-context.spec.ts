import type { ActivatedRouteSnapshot } from '@angular/router';
import { spaceIdFromSnapshot } from './admin-space-context';

function snapshot(
  spaceId: string | null,
  firstChild: ActivatedRouteSnapshot | null = null,
): ActivatedRouteSnapshot {
  return {
    paramMap: { get: (key: string) => (key === 'spaceId' ? spaceId : null) },
    firstChild,
  } as unknown as ActivatedRouteSnapshot;
}

describe('spaceIdFromSnapshot', () => {
  it('reads spaceId from the root when it owns the param', () => {
    expect(spaceIdFromSnapshot(snapshot('court-basketball-a'))).toBe('court-basketball-a');
  });

  it('walks down to the child that owns the param', () => {
    const child = snapshot('study-room-b');
    const root = snapshot(null, child);

    expect(spaceIdFromSnapshot(root)).toBe('study-room-b');
  });

  it('returns null when no route in the tree owns the param', () => {
    const root = snapshot(null, snapshot(null));

    expect(spaceIdFromSnapshot(root)).toBeNull();
  });
});
