import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  MusicianSearchResultDto,
  MusicianSearchSort,
  PaginatedDto,
  PublicProfileDto,
} from '@stagelink/shared';

import { environment } from '../../../environments/environment';

export interface MusicianSearchFilters {
  query?: string;
  instrument?: string;
  genre?: string;
  location?: string;
  available?: boolean;
  experienceLevel?: string;
  influence?: string;
  inBand?: boolean;
  sort?: MusicianSearchSort;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class MusicianSearchService {
  private readonly http = inject(HttpClient);

  search(filters: MusicianSearchFilters) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '')
        params = params.set(key, String(value));
    }
    return this.http.get<PaginatedDto<MusicianSearchResultDto>>(
      `${environment.apiUrl}/musicians/search`,
      { params },
    );
  }

  getPublic(id: string) {
    return this.http.get<PublicProfileDto>(`${environment.apiUrl}/musicians/${id}/public`);
  }
}
