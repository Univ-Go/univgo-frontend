import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { SKIP_ERROR_NOTIFICATION } from '../../../core/http/http-error.interceptor';
import { AuthRepository, type Credentials } from '../domain/auth.repository';
import { type AuthenticatedUser, roleFromNames } from '../domain/session';

interface SessionDto {
  readonly id: string;
  readonly identification: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly roles: readonly string[];
}

function toAuthenticatedUser(dto: SessionDto): AuthenticatedUser {
  return {
    id: dto.id,
    identification: dto.identification,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    role: roleFromNames(dto.roles),
  };
}

@Injectable()
export class HttpAuthRepository extends AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/auth`;

  /**
   * Every failure here is reported by its caller: sign-in renders it beside the form, and an
   * expired session is announced once by the session store rather than by each request that hits it.
   */
  private readonly silent = new HttpContext().set(SKIP_ERROR_NOTIFICATION, true);

  signIn(credentials: Credentials): Observable<AuthenticatedUser> {
    return this.http
      .post<SessionDto>(`${this.baseUrl}/login`, credentials, { context: this.silent })
      .pipe(map(toAuthenticatedUser));
  }

  currentUser(): Observable<AuthenticatedUser> {
    return this.http
      .get<SessionDto>(`${this.baseUrl}/me`, { context: this.silent })
      .pipe(map(toAuthenticatedUser));
  }

  renew(): Observable<AuthenticatedUser> {
    return this.http
      .post<SessionDto>(`${this.baseUrl}/refresh`, null, { context: this.silent })
      .pipe(map(toAuthenticatedUser));
  }

  signOut(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, null, { context: this.silent });
  }
}
