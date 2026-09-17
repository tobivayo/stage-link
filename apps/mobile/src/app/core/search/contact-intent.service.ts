import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface ContactIntentInput {
  targetProfileType: 'MUSICIAN' | 'BAND_PROJECT';
  targetProfileId: string;
  sourceType: 'SEARCH_RESULT' | 'RECOMMENDATION' | 'APPLICATION';
  sourceEntityId?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactIntentService {
  private readonly http = inject(HttpClient);

  create(input: ContactIntentInput) {
    return this.http.post(`${environment.apiUrl}/contact-intents`, input);
  }

  getMine() {
    return this.http.get<unknown[]>(`${environment.apiUrl}/contact-intents/my`);
  }
}
