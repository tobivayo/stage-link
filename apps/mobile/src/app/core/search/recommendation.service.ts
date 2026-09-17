import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { MusicianSearchResultDto, RecommendationDecision } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly http = inject(HttpClient);

  getMusicians(bandProjectId?: string, limit = 20) {
    let params = new HttpParams().set('limit', limit);
    if (bandProjectId) params = params.set('bandProjectId', bandProjectId);
    return this.http.get<{ items: MusicianSearchResultDto[]; context: string }>(
      `${environment.apiUrl}/recommendations/musicians`,
      { params },
    );
  }

  decide(musicianProfileId: string, decision: RecommendationDecision, bandProjectId?: string) {
    return this.http.post(
      `${environment.apiUrl}/recommendations/musicians/${musicianProfileId}/decision`,
      {
        decision,
        bandProjectId,
      },
    );
  }
}
