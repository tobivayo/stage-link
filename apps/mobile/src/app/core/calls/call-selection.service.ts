import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CallApplicationDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CallSelectionService {
  private readonly http = inject(HttpClient);

  select(callId: string, applicationIds: string[], rejectOthers = false) {
    return this.http.post<CallApplicationDto[]>(
      `${environment.apiUrl}/calls/${callId}/select-applicants`,
      { applicationIds, rejectOthers },
    );
  }
}
