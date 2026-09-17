import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Router } from '@angular/router';
import { type Observable, firstValueFrom, isObservable, of } from 'rxjs';
import type { AdminSpace } from '../domain/attendance';
import { adminSpaceGuard } from './admin-space.guard';
import { AdminSpacesStore } from './admin-spaces.store';

const COURT: AdminSpace = {
  spaceId: 'f2e1',
  spaceName: 'Cancha de Básquetbol A',
  capacity: 50,
  underMaintenance: false,
};

function routeWithSpaceId(spaceId: string | null): ActivatedRouteSnapshot {
  return {
    paramMap: { get: (key: string) => (key === 'spaceId' ? spaceId : null) },
  } as unknown as ActivatedRouteSnapshot;
}

describe('adminSpaceGuard', () => {
  let createUrlTree: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createUrlTree = vi.fn(() => ({}) as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { createUrlTree } },
        {
          provide: AdminSpacesStore,
          useValue: {
            find: (id: string): Observable<AdminSpace | null> =>
              of(id === COURT.spaceId ? COURT : null),
          },
        },
      ],
    });
  });

  function activate(spaceId: string | null): Promise<unknown> {
    const result = TestBed.runInInjectionContext(() =>
      adminSpaceGuard(routeWithSpaceId(spaceId), {} as RouterStateSnapshot),
    );

    return isObservable(result) ? firstValueFrom(result) : Promise.resolve(result);
  }

  it('lets a space of the catalogue through', async () => {
    expect(await activate('f2e1')).toBe(true);
    expect(createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects an id that is not a space to the spaces grid', async () => {
    expect(await activate('does-not-exist')).not.toBe(true);
    expect(createUrlTree).toHaveBeenCalledWith(['/admin', 'spaces']);
  });

  it('redirects when the id is missing entirely, without asking the catalogue', async () => {
    expect(await activate(null)).not.toBe(true);
    expect(createUrlTree).toHaveBeenCalledWith(['/admin', 'spaces']);
  });
});
