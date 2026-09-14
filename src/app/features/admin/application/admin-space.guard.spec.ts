import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Router } from '@angular/router';
import { adminSpaceGuard } from './admin-space.guard';

function routeWithSpaceId(spaceId: string | null): ActivatedRouteSnapshot {
  return { paramMap: { get: (key: string) => (key === 'spaceId' ? spaceId : null) } } as unknown as ActivatedRouteSnapshot;
}

describe('adminSpaceGuard', () => {
  let createUrlTree: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createUrlTree = vi.fn(() => ({}) as UrlTree);

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { createUrlTree } }],
    });
  });

  function activate(spaceId: string | null) {
    return TestBed.runInInjectionContext(() =>
      adminSpaceGuard(routeWithSpaceId(spaceId), {} as RouterStateSnapshot),
    );
  }

  it('lets a known space through', () => {
    expect(activate('court-basketball-a')).toBe(true);
    expect(createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects an unknown space to the spaces grid', () => {
    const result = activate('does-not-exist');

    expect(result).not.toBe(true);
    expect(createUrlTree).toHaveBeenCalledWith(['/admin', 'spaces']);
  });

  it('redirects when the id is missing entirely', () => {
    const result = activate(null);

    expect(result).not.toBe(true);
    expect(createUrlTree).toHaveBeenCalledWith(['/admin', 'spaces']);
  });
});
