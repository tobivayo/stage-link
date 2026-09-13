import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { ProviderProfileDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProviderProfileService {
  private readonly http = inject(HttpClient);

  getMine() {
    return this.http.get<ProviderProfileDto[]>(`${environment.apiUrl}/profiles/provider/me`);
  }

  create(input: object) {
    return this.http.post<ProviderProfileDto>(`${environment.apiUrl}/profiles/provider`, input);
  }

  update(id: string, input: object) {
    return this.http.patch<ProviderProfileDto>(
      `${environment.apiUrl}/profiles/provider/${id}`,
      input,
    );
  }
}
