import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { RoleCode, UserRoleDto } from '@stagelink/shared';

import { environment } from '../../../environments/environment';

export interface AvailableRole {
  code: RoleCode;
  name: string;
  description: string | null;
  canSelfManage: boolean;
  requiresProfileCompletion: boolean;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);

  getAvailable() {
    return this.http.get<AvailableRole[]>(`${environment.apiUrl}/roles`);
  }

  getMine() {
    return this.http.get<UserRoleDto[]>(`${environment.apiUrl}/roles/me`);
  }

  requestActivation(code: RoleCode) {
    return this.http.post<UserRoleDto>(`${environment.apiUrl}/roles/${code}/activate`, {});
  }

  deactivate(code: RoleCode) {
    return this.http.delete<UserRoleDto>(`${environment.apiUrl}/roles/${code}`);
  }
}
