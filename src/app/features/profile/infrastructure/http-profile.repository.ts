import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { SKIP_ERROR_NOTIFICATION } from '../../../core/http/http-error.interceptor';
import { type PasswordChange, ProfileRepository } from '../domain/profile.repository';

@Injectable()
export class HttpProfileRepository extends ProfileRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/users/me`;

  /**
   * A wrong current password arrives as a 400 and is answered beside the form, where the user is
   * about to correct it, so the request opts out of the automatic alert.
   */
  changePassword(change: PasswordChange): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/password`, change, {
      context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
    });
  }
}
