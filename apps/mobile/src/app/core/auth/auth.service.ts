import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type {
  AuthenticatedUserDto,
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
} from '@stagelink/shared';
import { catchError, finalize, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly currentUser = signal<AuthenticatedUserDto | null>(null);

  readonly user = this.currentUser.asReadonly();

  register(input: RegisterRequestDto): Observable<AuthResponseDto> {
    return this.http
      .post<AuthResponseDto>(`${environment.apiUrl}/auth/register`, input)
      .pipe(tap((response) => this.storeSession(response)));
  }

  login(input: LoginRequestDto): Observable<AuthResponseDto> {
    return this.http
      .post<AuthResponseDto>(`${environment.apiUrl}/auth/login`, input)
      .pipe(tap((response) => this.storeSession(response)));
  }

  loadCurrentUser(): Observable<AuthenticatedUserDto> {
    return this.http
      .get<AuthenticatedUserDto>(`${environment.apiUrl}/users/me`)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).pipe(
      catchError(() => of(undefined)),
      finalize(() => this.clearSession()),
    );
  }

  clearSession(): void {
    this.tokenStorage.clear();
    this.currentUser.set(null);
  }

  private storeSession(response: AuthResponseDto): void {
    this.tokenStorage.set(response.accessToken);
    this.currentUser.set(response.user);
  }
}
