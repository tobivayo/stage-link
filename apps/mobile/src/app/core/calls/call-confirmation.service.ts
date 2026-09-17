import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CallConfirmationDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CallConfirmationService {
  private readonly http = inject(HttpClient);

  getForCall(callId: string) {
    return this.http.get<CallConfirmationDto[]>(
      `${environment.apiUrl}/calls/${callId}/confirmations`,
    );
  }

  confirm(id: string) {
    return this.http.post<CallConfirmationDto>(
      `${environment.apiUrl}/call-confirmations/${id}/confirm`,
      {},
    );
  }

  decline(id: string, reason?: string) {
    return this.http.post<CallConfirmationDto>(
      `${environment.apiUrl}/call-confirmations/${id}/decline`,
      { reason },
    );
  }
}
