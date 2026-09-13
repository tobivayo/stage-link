import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { BandInvitationDto, BandMemberDto, BandProjectDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BandProjectService {
  private readonly http = inject(HttpClient);

  getMine() {
    return this.http.get<BandProjectDto[]>(`${environment.apiUrl}/bands/my`);
  }

  get(id: string) {
    return this.http.get<BandProjectDto>(`${environment.apiUrl}/bands/${id}`);
  }

  create(input: object) {
    return this.http.post<BandProjectDto>(`${environment.apiUrl}/bands`, input);
  }

  update(id: string, input: object) {
    return this.http.patch<BandProjectDto>(`${environment.apiUrl}/bands/${id}`, input);
  }

  getMembers(id: string) {
    return this.http.get<BandMemberDto[]>(`${environment.apiUrl}/bands/${id}/members`);
  }

  invite(id: string, input: object) {
    return this.http.post<BandInvitationDto>(
      `${environment.apiUrl}/bands/${id}/invitations`,
      input,
    );
  }

  removeMember(id: string, memberId: string) {
    return this.http.delete(`${environment.apiUrl}/bands/${id}/members/${memberId}`);
  }

  getMyInvitations() {
    return this.http.get<BandInvitationDto[]>(`${environment.apiUrl}/bands/invitations/me`);
  }

  respond(invitationId: string, accept: boolean) {
    return this.http.post(
      `${environment.apiUrl}/bands/invitations/${invitationId}/${accept ? 'accept' : 'reject'}`,
      {},
    );
  }
}
