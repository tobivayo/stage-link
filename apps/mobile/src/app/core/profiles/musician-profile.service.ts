import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { MusicianProfileDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

export interface MusicianProfileInput {
  stageName?: string;
  bio?: string;
  instruments: string[];
  genres: string[];
  influences?: string[];
  experience?: string;
  experienceLevel?: string;
  previousProjects?: string[];
  availableForProjects: boolean;
  isSoloProject?: boolean;
  locationText?: string;
  photoUrl?: string;
  visibility?: string;
  locationVisibility?: string;
}

@Injectable({ providedIn: 'root' })
export class MusicianProfileService {
  private readonly http = inject(HttpClient);

  getMine() {
    return this.http.get<{ completionStatus: string; profile: MusicianProfileDto | null }>(
      `${environment.apiUrl}/profiles/musician/me`,
    );
  }

  create(input: MusicianProfileInput) {
    return this.http.post<MusicianProfileDto>(`${environment.apiUrl}/profiles/musician`, input);
  }

  update(input: Partial<MusicianProfileInput>) {
    return this.http.patch<MusicianProfileDto>(`${environment.apiUrl}/profiles/musician/me`, input);
  }
}
