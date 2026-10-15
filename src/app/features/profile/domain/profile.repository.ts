import type { Observable } from 'rxjs';

export interface PasswordChange {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmation: string;
}

/** Mirrors `ChangePasswordService.MIN_LENGTH` on the server, which stays the authority. */
export const PASSWORD_MIN_LENGTH = 8;

/** The signed-in user's own account, whatever their role. */
export abstract class ProfileRepository {
  /** The server revokes every session of the account when this succeeds. */
  abstract changePassword(change: PasswordChange): Observable<void>;
}
