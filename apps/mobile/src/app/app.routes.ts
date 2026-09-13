import type { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./domains/auth/pages/login/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./domains/auth/pages/register/register-page.component').then(
        (m) => m.RegisterPageComponent,
      ),
  },
  {
    path: 'public/profiles/:type/:id',
    loadComponent: () =>
      import('./domains/profiles/pages/public-profile/public-profile-page.component').then(
        (m) => m.PublicProfilePageComponent,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./domains/dashboard/pages/dashboard/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./domains/settings/pages/role-preferences/role-preferences-page.component').then(
            (m) => m.RolePreferencesPageComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./domains/profiles/pages/profile/profile-page.component').then(
            (m) => m.ProfilePageComponent,
          ),
      },
      {
        path: 'profile/musician',
        loadComponent: () =>
          import('./domains/profiles/pages/musician-profile/musician-profile-page.component').then(
            (m) => m.MusicianProfilePageComponent,
          ),
      },
      {
        path: 'profile/bands',
        loadComponent: () =>
          import('./domains/bands/pages/bands/bands-page.component').then(
            (m) => m.BandsPageComponent,
          ),
      },
      {
        path: 'profile/bands/new',
        loadComponent: () =>
          import('./domains/bands/pages/band-editor/band-editor-page.component').then(
            (m) => m.BandEditorPageComponent,
          ),
      },
      {
        path: 'profile/bands/:id/members',
        loadComponent: () =>
          import('./domains/bands/pages/band-members/band-members-page.component').then(
            (m) => m.BandMembersPageComponent,
          ),
      },
      {
        path: 'profile/bands/:id',
        loadComponent: () =>
          import('./domains/bands/pages/band-editor/band-editor-page.component').then(
            (m) => m.BandEditorPageComponent,
          ),
      },
      {
        path: 'profile/venue',
        loadComponent: () =>
          import('./domains/venues/pages/venue-profile/venue-profile-page.component').then(
            (m) => m.VenueProfilePageComponent,
          ),
      },
      {
        path: 'profile/provider',
        loadComponent: () =>
          import('./domains/providers/pages/provider-profile/provider-profile-page.component').then(
            (m) => m.ProviderProfilePageComponent,
          ),
      },
      {
        path: 'profile/portfolio',
        loadComponent: () =>
          import('./domains/profiles/pages/portfolio/portfolio-page.component').then(
            (m) => m.PortfolioPageComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
