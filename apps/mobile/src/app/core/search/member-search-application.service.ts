import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { MemberSearchApplicationDto, MemberSearchApplicationStatus } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MemberSearchApplicationService {
  private readonly http = inject(HttpClient);

  apply(searchId: string, message?: string) {
    return this.http.post<MemberSearchApplicationDto>(
      `${environment.apiUrl}/member-searches/${searchId}/applications`,
      { message: message || undefined },
    );
  }

  getReceived(searchId: string) {
    return this.http.get<MemberSearchApplicationDto[]>(
      `${environment.apiUrl}/member-searches/${searchId}/applications`,
    );
  }

  getMine() {
    return this.http.get<MemberSearchApplicationDto[]>(
      `${environment.apiUrl}/member-search-applications/my`,
    );
  }

  updateStatus(id: string, status: MemberSearchApplicationStatus) {
    return this.http.patch<MemberSearchApplicationDto>(
      `${environment.apiUrl}/member-search-applications/${id}/status`,
      { status },
    );
  }
}
