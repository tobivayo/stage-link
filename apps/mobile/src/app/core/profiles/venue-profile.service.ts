import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { VenueProfileDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VenueProfileService {
  private readonly http = inject(HttpClient);

  getMine() {
    return this.http.get<VenueProfileDto[]>(`${environment.apiUrl}/profiles/venue/me`);
  }

  create(input: object) {
    return this.http.post<VenueProfileDto>(`${environment.apiUrl}/profiles/venue`, input);
  }

  update(id: string, input: object) {
    return this.http.patch<VenueProfileDto>(`${environment.apiUrl}/profiles/venue/${id}`, input);
  }
}
