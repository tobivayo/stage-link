import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { MemberSearchDto, PaginatedDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MemberSearchService {
  private readonly http = inject(HttpClient);

  list(filters: Record<string, string | number | undefined> = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<PaginatedDto<MemberSearchDto>>(`${environment.apiUrl}/member-searches`, {
      params,
    });
  }

  getMine() {
    return this.http.get<MemberSearchDto[]>(`${environment.apiUrl}/member-searches/my`);
  }

  get(id: string) {
    return this.http.get<MemberSearchDto>(`${environment.apiUrl}/member-searches/${id}`);
  }

  create(input: object) {
    return this.http.post<MemberSearchDto>(`${environment.apiUrl}/member-searches`, input);
  }

  update(id: string, input: object) {
    return this.http.patch<MemberSearchDto>(`${environment.apiUrl}/member-searches/${id}`, input);
  }

  close(id: string) {
    return this.http.post<MemberSearchDto>(`${environment.apiUrl}/member-searches/${id}/close`, {});
  }
}
