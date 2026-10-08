import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  type Observable,
  catchError,
  map,
  shareReplay,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AdminSpaceCrudRepository } from '../domain/admin-space-crud.repository';
import type { AdminSpaceSummary } from '../domain/admin-space-detail';
import type { AdminSpace } from '../domain/attendance';

function toAdminSpace(space: AdminSpaceSummary): AdminSpace {
  return {
    spaceId: space.spaceId,
    spaceName: space.name,
    capacity: space.capacity,
  };
}

/**
 * The spaces the panel manages. Read through the panel's own endpoint rather than the student
 * catalogue, which cannot answer what the panel needs: the catalogue has no `spaceTypeId`, no
 * editable windows and no photograph ids, it costs four extra queries to compute blocks and
 * closures nobody here asked about, and it excludes archived spaces by construction. One truth
 * about which spaces exist is preserved — it is the same table.
 *
 * Held for the session because four places ask for it: the grid, the shell's switcher, the guard on
 * `:spaceId` and the edit screen's own navigation. A directory of spaces does not change while
 * somebody scans at a door.
 *
 * It reads archived spaces too, so the grid can offer to restore one, and hides them from everything
 * that is about *operating* a space: the switcher and the guard. One request answers both, and the
 * two views cannot drift the way a second request would let them.
 */
@Injectable({ providedIn: 'root' })
export class AdminSpacesStore {
  private readonly spaces = inject(AdminSpaceCrudRepository);

  private readonly reload = new BehaviorSubject<void>(undefined);

  /**
   * `refresh()` used to drop a cached observable, which invalidated the cache for *future* callers
   * and left every current subscriber replaying the old list. `AdminHeader` subscribes once, when it
   * is constructed, and `AdminLayout` is never destroyed while inside `/admin` — so creating or
   * archiving a space left the space switcher stale for the rest of the session. Routing the cache
   * through a subject is what makes an invalidation reach a view that is already on screen.
   *
   * A failed read is rethrown rather than cached, so a retry can still succeed.
   */
  private readonly catalogue: Observable<readonly AdminSpaceSummary[]> = this.reload.pipe(
    switchMap(() =>
      this.spaces.list(true).pipe(catchError((error: unknown) => throwError(() => error))),
    ),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  /** Everything the grid shows, archived spaces included. */
  public list(): Observable<readonly AdminSpaceSummary[]> {
    return this.catalogue;
  }

  /** Only the spaces an administrator can actually operate today. */
  public listActive(): Observable<readonly AdminSpaceSummary[]> {
    return this.list().pipe(map((spaces) => spaces.filter((space) => !space.archived)));
  }

  /** The switcher's three fields, derived from the same request the grid already made. */
  public listForSwitcher(): Observable<readonly AdminSpace[]> {
    return this.listActive().pipe(map((spaces) => spaces.map(toAdminSpace)));
  }

  /**
   * `null` for an id that is not a space the panel can work with — unknown, or archived. Both are a
   * stale link rather than a fault, and the server refuses an archived space everywhere a section of
   * the panel would use it, so letting one through would only move the failure later.
   *
   * `take(1)` is not optional: the pipeline above never completes, and a `CanActivateFn` that never
   * completes hangs the navigation.
   */
  public find(spaceId: string): Observable<AdminSpace | null> {
    return this.listForSwitcher().pipe(
      take(1),
      map((spaces) => spaces.find((space) => space.spaceId === spaceId) ?? null),
    );
  }

  /**
   * Re-reads the directory. Needed after creating, archiving or restoring a space, and after saving
   * its identity — the name and the capacity are both in the switcher's model. Saving the usage, the
   * hours or the photographs reaches neither the grid nor the switcher, so those must not call this:
   * it would re-request the catalogue on every photograph added.
   */
  public refresh(): void {
    this.reload.next();
  }
}
