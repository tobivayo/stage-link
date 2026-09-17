import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { CallDto } from '@stagelink/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { CallService } from '../../../../core/calls/call.service';

@Component({
  selector: 'app-calls-list-page',
  templateUrl: './calls-list-page.component.html',
  styleUrl: '../call-pages.scss',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallsListPageComponent {
  private readonly calls = inject(CallService);
  private readonly fb = inject(FormBuilder);
  readonly items = signal<CallDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasMore = signal(false);
  readonly searched = signal(false);
  private page = 1;
  readonly form = this.fb.nonNullable.group({
    genre: '',
    location: '',
    type: '',
    status: 'OPEN',
  });

  constructor() {
    this.search();
  }

  search(reset = true): void {
    if (reset) this.page = 1;
    this.loading.set(true);
    this.error.set(null);
    this.calls.list({ ...this.form.getRawValue(), page: this.page, limit: 10 }).subscribe({
      next: (response) => {
        this.items.set(reset ? response.items : [...this.items(), ...response.items]);
        this.hasMore.set(response.hasMore);
        this.searched.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar las convocatorias.');
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    this.page += 1;
    this.search(false);
  }
}
