import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { PublicProfileDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PublicProfileService {
  private readonly http = inject(HttpClient);

  get(type: string, id: string) {
    return this.http.get<PublicProfileDto>(`${environment.apiUrl}/profiles/public/${type}/${id}`);
  }
}
