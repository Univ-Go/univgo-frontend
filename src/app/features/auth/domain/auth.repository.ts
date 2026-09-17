import type { Observable } from 'rxjs';
import type { AuthenticatedUser } from './session';

export interface Credentials {
  readonly identifier: string;
  readonly password: string;
}

/**
 * Session port. Every operation answers with the user rather than with a token: the credentials
 * themselves live in cookies the browser manages and no code in the application can read.
 */
export abstract class AuthRepository {
  abstract signIn(credentials: Credentials): Observable<AuthenticatedUser>;

  /** Rebuilds the session from the cookies the browser still holds, after a reload or a new tab. */
  abstract currentUser(): Observable<AuthenticatedUser>;

  abstract renew(): Observable<AuthenticatedUser>;

  abstract signOut(): Observable<void>;
}
