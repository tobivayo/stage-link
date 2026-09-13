import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { PortfolioItemDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly http = inject(HttpClient);

  getMine() {
    return this.http.get<PortfolioItemDto[]>(`${environment.apiUrl}/portfolio/me`);
  }

  getForProfile(type: string, id: string) {
    return this.http.get<PortfolioItemDto[]>(
      `${environment.apiUrl}/portfolio/profile/${type}/${id}`,
    );
  }

  create(input: object) {
    return this.http.post<PortfolioItemDto>(`${environment.apiUrl}/portfolio`, input);
  }

  update(id: string, input: object) {
    return this.http.patch<PortfolioItemDto>(`${environment.apiUrl}/portfolio/${id}`, input);
  }

  remove(id: string) {
    return this.http.delete(`${environment.apiUrl}/portfolio/${id}`);
  }

  shareOnMyProfile(id: string) {
    return this.http.post(`${environment.apiUrl}/portfolio/${id}/share-on-my-profile`, {});
  }
}
