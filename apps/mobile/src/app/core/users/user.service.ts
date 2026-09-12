import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { AuthenticatedUserDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  getMe() {
    return this.http.get<AuthenticatedUserDto>(`${environment.apiUrl}/users/me`);
  }
}
