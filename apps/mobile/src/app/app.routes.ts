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
    path: 'public/calls',
    loadComponent: () =>
      import('./domains/calls/pages/calls-list/calls-list-page.component').then(
        (m) => m.CallsListPageComponent,
      ),
  },
  {
    path: 'public/calls/:id',
    loadComponent: () =>
      import('./domains/calls/pages/call-detail/call-detail-page.component').then(
        (m) => m.CallDetailPageComponent,
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
        path: 'calls/new',
        loadComponent: () =>
          import('./domains/calls/pages/call-editor/call-editor-page.component').then(
            (m) => m.CallEditorPageComponent,
          ),
      },
      {
        path: 'calls/my',
        loadComponent: () =>
          import('./domains/calls/pages/my-calls/my-calls-page.component').then(
            (m) => m.MyCallsPageComponent,
          ),
      },
      {
        path: 'my-call-applications',
        loadComponent: () =>
          import('./domains/calls/pages/my-call-applications/my-call-applications-page.component').then(
            (m) => m.MyCallApplicationsPageComponent,
          ),
      },
      {
        path: 'calls',
        loadComponent: () =>
          import('./domains/calls/pages/calls-list/calls-list-page.component').then(
            (m) => m.CallsListPageComponent,
          ),
      },
      {
        path: 'calls/:id/edit',
        loadComponent: () =>
          import('./domains/calls/pages/call-editor/call-editor-page.component').then(
            (m) => m.CallEditorPageComponent,
          ),
      },
      {
        path: 'calls/:id/applications/:applicationId',
        loadComponent: () =>
          import('./domains/calls/pages/call-applications/call-applications-page.component').then(
            (m) => m.CallApplicationsPageComponent,
          ),
      },
      {
        path: 'calls/:id/applications',
        loadComponent: () =>
          import('./domains/calls/pages/call-applications/call-applications-page.component').then(
            (m) => m.CallApplicationsPageComponent,
          ),
      },
      {
        path: 'calls/:id/selection',
        loadComponent: () =>
          import('./domains/calls/pages/call-applications/call-applications-page.component').then(
            (m) => m.CallApplicationsPageComponent,
          ),
      },
      {
        path: 'calls/:id/apply',
        loadComponent: () =>
          import('./domains/calls/pages/call-detail/call-detail-page.component').then(
            (m) => m.CallDetailPageComponent,
          ),
      },
      {
        path: 'calls/:id/confirmation',
        loadComponent: () =>
          import('./domains/calls/pages/call-detail/call-detail-page.component').then(
            (m) => m.CallDetailPageComponent,
          ),
      },
      {
        path: 'calls/:id',
        loadComponent: () =>
          import('./domains/calls/pages/call-detail/call-detail-page.component').then(
            (m) => m.CallDetailPageComponent,
          ),
      },
      { path: 'search', pathMatch: 'full', redirectTo: 'search/musicians' },
      {
        path: 'search/musicians',
        loadComponent: () =>
          import('./domains/search/pages/musician-search/musician-search-page.component').then(
            (m) => m.MusicianSearchPageComponent,
          ),
      },
      {
        path: 'search/musicians/:id',
        loadComponent: () =>
          import('./domains/search/pages/musician-search-detail/musician-search-detail-page.component').then(
            (m) => m.MusicianSearchDetailPageComponent,
          ),
      },
      {
        path: 'recommendations/review',
        loadComponent: () =>
          import('./domains/search/pages/recommendations/recommendations-page.component').then(
            (m) => m.RecommendationsPageComponent,
          ),
      },
      {
        path: 'recommendations',
        loadComponent: () =>
          import('./domains/search/pages/recommendations/recommendations-page.component').then(
            (m) => m.RecommendationsPageComponent,
          ),
      },
      {
        path: 'member-searches/new',
        loadComponent: () =>
          import('./domains/search/pages/member-search-editor/member-search-editor-page.component').then(
            (m) => m.MemberSearchEditorPageComponent,
          ),
      },
      {
        path: 'member-searches/my',
        loadComponent: () =>
          import('./domains/search/pages/my-member-searches/my-member-searches-page.component').then(
            (m) => m.MyMemberSearchesPageComponent,
          ),
      },
      {
        path: 'member-searches/applications',
        loadComponent: () =>
          import('./domains/search/pages/my-applications/my-applications-page.component').then(
            (m) => m.MyApplicationsPageComponent,
          ),
      },
      {
        path: 'member-searches',
        loadComponent: () =>
          import('./domains/search/pages/member-searches/member-searches-page.component').then(
            (m) => m.MemberSearchesPageComponent,
          ),
      },
      {
        path: 'member-searches/:id/apply',
        loadComponent: () =>
          import('./domains/search/pages/member-search-detail/member-search-detail-page.component').then(
            (m) => m.MemberSearchDetailPageComponent,
          ),
      },
      {
        path: 'member-searches/:id',
        loadComponent: () =>
          import('./domains/search/pages/member-search-detail/member-search-detail-page.component').then(
            (m) => m.MemberSearchDetailPageComponent,
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
