import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { TokenStorageService } from './token-storage.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const token = inject(TokenStorageService).get();
  return token
    ? true
    : inject(Router).createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
