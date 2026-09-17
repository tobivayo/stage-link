import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CallDto } from '@stagelink/shared';
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

import { CallService } from '../../../../core/calls/call.service';

@Component({
  selector: 'app-my-calls-page',
  templateUrl: './my-calls-page.component.html',
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
export class MyCallsPageComponent {
  private readonly calls = inject(CallService);
  readonly items = signal<CallDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.calls.getMine().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus convocatorias.');
        this.loading.set(false);
      },
    });
  }
}
