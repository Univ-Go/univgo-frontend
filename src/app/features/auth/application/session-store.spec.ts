import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { AuthRepository } from '../domain/auth.repository';
import type { AuthenticatedUser } from '../domain/session';
import { SessionStore } from './session-store';

const USER: AuthenticatedUser = {
  id: 'f2e1',
  identification: '1234567890',
  email: 'sofia.ramirez@univgo.edu',
  firstName: 'Sofía',
  lastName: 'Ramírez',
  role: 'student',
};

describe('SessionStore', () => {
  let repository: {
    currentUser: ReturnType<typeof vi.fn>;
    renew: ReturnType<typeof vi.fn>;
    signIn: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
  let notifications: { error: ReturnType<typeof vi.fn> };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  function store(): SessionStore {
    return TestBed.inject(SessionStore);
  }

  beforeEach(() => {
    repository = {
      currentUser: vi.fn(),
      renew: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
    notifications = { error: vi.fn() };
    localStorage.clear();
    router = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthRepository, useValue: repository },
        { provide: NotificationService, useValue: notifications },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('starts out not knowing whether anyone is signed in', () => {
    expect(store().status()).toBe('unknown');
    expect(store().user()).toBeNull();
  });

  it('asks the server once no matter how many guards of one navigation need the answer', () => {
    // The request has to be in flight while the other guards subscribe, which is what a real
    // one is and a synchronous stub is not.
    const inFlight = new Subject<AuthenticatedUser>();
    repository.currentUser.mockReturnValue(inFlight);
    const session = store();

    session.ensureRestored().subscribe();
    session.ensureRestored().subscribe();
    session.ensureRestored().subscribe();
    inFlight.next(USER);
    inFlight.complete();

    expect(repository.currentUser).toHaveBeenCalledTimes(1);
    expect(session.status()).toBe('authenticated');
    expect(session.user()).toEqual(USER);
  });

  it('checks again on the next navigation instead of trusting what it learned once', async () => {
    repository.currentUser.mockReturnValue(of(USER));
    const session = store();

    await new Promise<void>((resolve) => session.ensureRestored().subscribe(() => resolve()));
    await new Promise<void>((resolve) => session.ensureRestored().subscribe(() => resolve()));

    expect(repository.currentUser).toHaveBeenCalledTimes(2);
  });

  it('announces the expiry after a reload, when only the stored hint remembers the session', () => {
    repository.currentUser.mockReturnValue(of(USER));
    const session = store();
    session.ensureRestored().subscribe();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthRepository, useValue: repository },
        { provide: NotificationService, useValue: notifications },
        { provide: Router, useValue: router },
      ],
    });
    const reloaded = TestBed.inject(SessionStore);

    expect(reloaded.status()).toBe('unknown');
    reloaded.expire();

    expect(notifications.error).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('treats a rejected restore as nobody being signed in, silently', () => {
    repository.currentUser.mockReturnValue(throwError(() => new Error('401')));
    const session = store();

    let restored: AuthenticatedUser | null | undefined;
    session.ensureRestored().subscribe((user) => (restored = user));

    expect(restored).toBeNull();
    expect(session.status()).toBe('anonymous');
    expect(notifications.error).not.toHaveBeenCalled();
  });

  it('renews once when several requests fail at the same time', () => {
    const renewal = new Subject<AuthenticatedUser>();
    repository.renew.mockReturnValue(renewal);
    const session = store();

    session.renew().subscribe();
    session.renew().subscribe();
    renewal.next(USER);
    renewal.complete();

    expect(repository.renew).toHaveBeenCalledTimes(1);
    expect(session.user()).toEqual(USER);
  });

  it('renews again after an earlier renewal finished', () => {
    repository.renew.mockReturnValue(of(USER));
    const session = store();

    session.renew().subscribe();
    session.renew().subscribe();

    expect(repository.renew).toHaveBeenCalledTimes(2);
  });

  it('announces the expiry once and sends the person back to sign in', () => {
    repository.currentUser.mockReturnValue(of(USER));
    const session = store();
    session.ensureRestored().subscribe();

    session.expire();

    expect(notifications.error).toHaveBeenCalledTimes(1);
    expect(notifications.error).toHaveBeenCalledWith({ code: 'unauthorized' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(session.status()).toBe('anonymous');
  });

  it('says nothing to someone who never had a session', () => {
    repository.currentUser.mockReturnValue(throwError(() => new Error('401')));
    const session = store();
    session.ensureRestored().subscribe();

    session.expire();

    expect(notifications.error).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('clears the session even when signing out fails on the server', () => {
    repository.currentUser.mockReturnValue(of(USER));
    repository.signOut.mockReturnValue(throwError(() => new Error('500')));
    const session = store();
    session.ensureRestored().subscribe();

    session.signOut().subscribe({ error: () => undefined });

    expect(session.status()).toBe('anonymous');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('reports the landing path the signed-in role calls for', () => {
    repository.currentUser.mockReturnValue(of({ ...USER, role: 'admin' as const }));
    const session = store();
    session.ensureRestored().subscribe();

    expect(session.landingPath()).toBe('/admin');
  });
});
