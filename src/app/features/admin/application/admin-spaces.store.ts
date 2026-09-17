import { Injectable, inject } from '@angular/core';
import { type Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import type { Space } from '../../spaces/domain/space';
import { SpaceRepository } from '../../spaces/domain/space.repository';
import type { AdminSpace } from '../domain/attendance';

function toAdminSpace(space: Space): AdminSpace {
  return { spaceId: space.id, spaceName: space.name, capacity: space.capacity };
}

/**
 * The spaces the panel manages, which are the campus's spaces: the same catalogue the student
 * browses, read through the same port. A second list would be a second truth, and the check-in
 * would then verify codes against spaces the server has never heard of.
 *
 * Held for the session because three separate places ask for it — the grid, the shell's switcher
 * and the guard on `:spaceId` — and a directory of spaces does not change while somebody scans at a
 * door. What can change is a space's maintenance flag, which the panel itself sets, so `refresh()`
 * exists for that and nothing else. A failed read drops the cache, otherwise the error would be
 * replayed to every later caller and no retry could ever succeed.
 */
@Injectable({ providedIn: 'root' })
export class AdminSpacesStore {
  private readonly spaces = inject(SpaceRepository);

  private catalogue?: Observable<readonly AdminSpace[]>;

  public list(): Observable<readonly AdminSpace[]> {
    this.catalogue ??= this.spaces.catalog(new Date()).pipe(
      map((spaces) => spaces.map(toAdminSpace)),
      catchError((error: unknown) => {
        this.catalogue = undefined;

        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.catalogue;
  }

  /** `null` for an id that is not a space, which is a stale link rather than a fault. */
  public find(spaceId: string): Observable<AdminSpace | null> {
    return this.list().pipe(
      map((spaces) => spaces.find((space) => space.spaceId === spaceId) ?? null),
    );
  }

  public refresh(): void {
    this.catalogue = undefined;
  }
}
