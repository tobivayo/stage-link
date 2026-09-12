import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { UpdateUserPreferencesDto, UserPreferencesDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);

  getMine() {
    return this.http.get<UserPreferencesDto>(`${environment.apiUrl}/user-preferences/me`);
  }

  updateMine(input: UpdateUserPreferencesDto) {
    return this.http.patch<UserPreferencesDto>(`${environment.apiUrl}/user-preferences/me`, input);
  }
}
