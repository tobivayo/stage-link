import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  imports: [
    RouterLink,
    IonButton,
    IonContent,
    IonHeader,
    IonSpinner,
    IonTitle,
    IonToolbar,
    IonFooter,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly loading = signal(false);

  ngOnInit(): void {
    if (this.auth.user()) {
      return;
    }
    this.loading.set(true);
    this.auth.loadCurrentUser().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.auth.clearSession();
        void this.router.navigateByUrl('/auth/login');
      },
    });
  }

  logout(): void {
    this.loading.set(true);
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/auth/login'));
  }
}
