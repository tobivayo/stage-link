import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import type { CallApplicationDto } from '@stagelink/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
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

import { CallApplicationService } from '../../../../core/calls/call-application.service';
import { CallSelectionService } from '../../../../core/calls/call-selection.service';

@Component({
  selector: 'app-call-applications-page',
  templateUrl: './call-applications-page.component.html',
  styleUrl: '../call-pages.scss',
  imports: [
    ReactiveFormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCheckbox,
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
export class CallApplicationsPageComponent {
  private readonly applications = inject(CallApplicationService);
  private readonly selection = inject(CallSelectionService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly callId = this.route.snapshot.paramMap.get('id')!;
  readonly items = signal<CallApplicationDto[]>([]);
  readonly selectedIds = signal(new Set<string>());
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    status: '',
    applicantType: '',
    genre: '',
    reason: '',
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.applications
      .getReceived(this.callId, { ...this.form.getRawValue(), page: 1, limit: 50 })
      .subscribe({
        next: (response) => {
          this.items.set(response.items);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No pudimos cargar los postulantes.');
          this.loading.set(false);
        },
      });
  }

  toggle(id: string, checked: boolean): void {
    const next = new Set(this.selectedIds());
    if (checked) next.add(id);
    else next.delete(id);
    this.selectedIds.set(next);
  }

  action(id: string, action: 'review' | 'preselect' | 'remove-preselection'): void {
    this.loading.set(true);
    this.applications.action(id, action, this.form.controls.reason.value).subscribe({
      next: () => this.load(),
      error: () => {
        this.error.set('No pudimos actualizar la postulación.');
        this.loading.set(false);
      },
    });
  }

  select(): void {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    this.loading.set(true);
    this.selection.select(this.callId, ids, true).subscribe({
      next: () => {
        this.selectedIds.set(new Set());
        this.load();
      },
      error: (error: { error?: { message?: string } }) => {
        this.error.set(error.error?.message || 'No pudimos completar la selección.');
        this.loading.set(false);
      },
    });
  }
}
