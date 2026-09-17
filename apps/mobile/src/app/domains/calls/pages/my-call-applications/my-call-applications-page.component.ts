import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CallApplicationDto } from '@stagelink/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { CallApplicationService } from '../../../../core/calls/call-application.service';

@Component({
  selector: 'app-my-call-applications-page',
  templateUrl: './my-call-applications-page.component.html',
  styleUrl: '../call-pages.scss',
  imports: [
    DatePipe,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCallApplicationsPageComponent {
  private readonly applications = inject(CallApplicationService);
  readonly items = signal<CallApplicationDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  withdraw(id: string): void {
    this.loading.set(true);
    this.applications.action(id, 'withdraw').subscribe({
      next: () => this.load(),
      error: () => {
        this.error.set('No pudimos retirar la postulación.');
        this.loading.set(false);
      },
    });
  }

  private load(): void {
    this.applications.getMine().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus postulaciones.');
        this.loading.set(false);
      },
    });
  }
}
