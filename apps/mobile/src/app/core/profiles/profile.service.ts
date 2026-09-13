import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { MyProfilesDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  getMine() {
    return this.http.get<MyProfilesDto>(`${environment.apiUrl}/profiles/me`);
  }
}
