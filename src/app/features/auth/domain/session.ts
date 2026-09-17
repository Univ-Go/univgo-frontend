/**
 * The backend names roles in its own vocabulary (`STUDENT`, `ADMIN`). Translating them here keeps
 * that spelling out of every guard and template, so a change on the server stays a change in one
 * function.
 */
export type UserRole = 'student' | 'admin';

export interface AuthenticatedUser {
  readonly id: string;
  readonly identification: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
}

const ADMIN_ROLE = 'ADMIN';

/** An account holding both roles is treated as an administrator: the wider capability wins. */
export function roleFromNames(names: readonly string[]): UserRole {
  return names.some((name) => name.toUpperCase() === ADMIN_ROLE) ? 'admin' : 'student';
}

/** Where a session lands when it has no destination of its own — after signing in, or on `/`. */
export function landingPathFor(role: UserRole): string {
  return role === 'admin' ? '/admin' : '/home';
}

export function fullName(user: AuthenticatedUser): string {
  return `${user.firstName} ${user.lastName}`;
}
