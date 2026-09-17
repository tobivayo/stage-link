import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CallApplicationDto, PaginatedDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CallApplicationService {
  private readonly http = inject(HttpClient);

  apply(callId: string, input: object) {
    return this.http.post<CallApplicationDto>(
      `${environment.apiUrl}/calls/${callId}/applications`,
      input,
    );
  }

  getReceived(callId: string, filters: Record<string, string | number | undefined> = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<PaginatedDto<CallApplicationDto>>(
      `${environment.apiUrl}/calls/${callId}/applications`,
      { params },
    );
  }

  getMine() {
    return this.http.get<CallApplicationDto[]>(`${environment.apiUrl}/call-applications/my`);
  }

  get(id: string) {
    return this.http.get<CallApplicationDto>(`${environment.apiUrl}/call-applications/${id}`);
  }

  action(
    id: string,
    action: 'withdraw' | 'review' | 'preselect' | 'remove-preselection',
    reason?: string,
  ) {
    return this.http.post<CallApplicationDto>(
      `${environment.apiUrl}/call-applications/${id}/${action}`,
      { reason },
    );
  }
}
