import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CallDto, CallStatusHistoryDto, PaginatedDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CallService {
  private readonly http = inject(HttpClient);

  list(filters: Record<string, string | number | undefined>) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<PaginatedDto<CallDto>>(`${environment.apiUrl}/calls`, { params });
  }

  get(id: string) {
    return this.http.get<CallDto>(`${environment.apiUrl}/calls/${id}`);
  }

  getMine() {
    return this.http.get<CallDto[]>(`${environment.apiUrl}/calls/my`);
  }

  create(input: object) {
    return this.http.post<CallDto>(`${environment.apiUrl}/calls`, input);
  }

  update(id: string, input: object) {
    return this.http.patch<CallDto>(`${environment.apiUrl}/calls/${id}`, input);
  }

  changeStatus(id: string, status: string, reason?: string) {
    return this.http.post<CallDto>(`${environment.apiUrl}/calls/${id}/status`, { status, reason });
  }

  cancel(id: string, reason?: string) {
    return this.http.post<CallDto>(`${environment.apiUrl}/calls/${id}/cancel`, { reason });
  }

  reopen(id: string, status: 'OPEN' | 'IN_REVIEW' = 'OPEN', reason?: string) {
    return this.http.post<CallDto>(`${environment.apiUrl}/calls/${id}/reopen`, { status, reason });
  }

  getStatusHistory(id: string) {
    return this.http.get<CallStatusHistoryDto[]>(
      `${environment.apiUrl}/calls/${id}/status-history`,
    );
  }
}
