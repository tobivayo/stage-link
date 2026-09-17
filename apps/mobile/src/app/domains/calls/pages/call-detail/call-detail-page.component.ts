import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { BandProjectDto, CallConfirmationDto, CallDto } from '@stagelink/shared';
import type { Observable } from 'rxjs';
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
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService } from '../../../../core/auth/auth.service';
import { BandProjectService } from '../../../../core/bands/band-project.service';
import { CallApplicationService } from '../../../../core/calls/call-application.service';
import { CallConfirmationService } from '../../../../core/calls/call-confirmation.service';
import { CallService } from '../../../../core/calls/call.service';

@Component({
  selector: 'app-call-detail-page',
  templateUrl: './call-detail-page.component.html',
  styleUrl: '../call-pages.scss',
  imports: [
    DatePipe,
    ReactiveFormsModule,
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
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallDetailPageComponent {
  readonly auth = inject(AuthService);
  private readonly calls = inject(CallService);
  private readonly applications = inject(CallApplicationService);
  private readonly confirmationService = inject(CallConfirmationService);
  private readonly bandsService = inject(BandProjectService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly call = signal<CallDto | null>(null);
  readonly bands = signal<BandProjectDto[]>([]);
  readonly confirmations = signal<CallConfirmationDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly myConfirmation = computed(() =>
    this.confirmations().find((item) => item.confirmerUserId === this.auth.user()?.id),
  );
  readonly applyForm = this.fb.nonNullable.group({
    applicantType: 'MUSICIAN',
    bandProjectId: '',
    message: '',
    technicalNeeds: '',
    requestedPayment: null as number | null,
    currency: 'ARS',
  });
  readonly managementForm = this.fb.nonNullable.group({ reason: '' });

  constructor() {
    this.load();
    this.bandsService
      .getMine()
      .subscribe((bands) => this.bands.set(bands.filter((band) => band.isOwner)));
  }

  apply(): void {
    const value = this.applyForm.getRawValue();
    this.run(
      this.applications.apply(this.id, {
        applicantType: value.applicantType,
        bandProjectId: value.applicantType === 'BAND_PROJECT' ? value.bandProjectId : undefined,
        message: value.message || undefined,
        technicalNeeds: value.technicalNeeds || undefined,
        requestedPayment: value.requestedPayment ?? undefined,
        currency: value.requestedPayment !== null ? value.currency : undefined,
      }),
      'Postulación enviada.',
    );
  }

  changeStatus(status: 'OPEN' | 'IN_REVIEW' | 'CLOSED'): void {
    this.run(
      this.calls.changeStatus(this.id, status, this.managementForm.controls.reason.value),
      'Estado actualizado.',
      true,
    );
  }

  cancel(): void {
    this.run(
      this.calls.cancel(this.id, this.managementForm.controls.reason.value),
      'Convocatoria cancelada.',
      true,
    );
  }

  reopen(status: 'OPEN' | 'IN_REVIEW'): void {
    this.run(
      this.calls.reopen(this.id, status, this.managementForm.controls.reason.value),
      'Convocatoria reabierta.',
      true,
    );
  }

  confirm(): void {
    const confirmation = this.myConfirmation();
    if (confirmation)
      this.run(this.confirmationService.confirm(confirmation.id), 'Fecha confirmada.', true);
  }

  decline(): void {
    const confirmation = this.myConfirmation();
    if (confirmation)
      this.run(
        this.confirmationService.decline(
          confirmation.id,
          this.managementForm.controls.reason.value,
        ),
        'Fecha rechazada.',
        true,
      );
  }

  private load(): void {
    this.loading.set(true);
    this.calls.get(this.id).subscribe({
      next: (call) => {
        this.call.set(call);
        this.loading.set(false);
        if (call.status === 'CLOSED' || call.status === 'COMPLETED') {
          this.confirmationService.getForCall(this.id).subscribe({
            next: (items) => this.confirmations.set(items),
            error: () => undefined,
          });
        }
      },
      error: () => {
        this.error.set('No pudimos cargar la convocatoria.');
        this.loading.set(false);
      },
    });
  }

  private run(request: Observable<unknown>, message: string, reload = false): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    request.subscribe({
      next: () => {
        this.success.set(message);
        this.loading.set(false);
        if (reload) this.load();
      },
      error: (error: { error?: { message?: string | string[] } }) => {
        const detail = error.error?.message;
        this.error.set(
          Array.isArray(detail) ? detail.join(', ') : detail || 'No pudimos completar la acción.',
        );
        this.loading.set(false);
      },
    });
  }
}
