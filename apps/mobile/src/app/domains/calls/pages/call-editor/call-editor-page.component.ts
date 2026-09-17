import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { BandProjectDto, VenueProfileDto } from '@stagelink/shared';
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

import { BandProjectService } from '../../../../core/bands/band-project.service';
import { CallService } from '../../../../core/calls/call.service';
import { MusicianProfileService } from '../../../../core/profiles/musician-profile.service';
import { VenueProfileService } from '../../../../core/profiles/venue-profile.service';

@Component({
  selector: 'app-call-editor-page',
  templateUrl: './call-editor-page.component.html',
  styleUrl: '../call-pages.scss',
  imports: [
    ReactiveFormsModule,
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
export class CallEditorPageComponent {
  private readonly calls = inject(CallService);
  private readonly bandsService = inject(BandProjectService);
  private readonly venuesService = inject(VenueProfileService);
  private readonly musicianService = inject(MusicianProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly bands = signal<BandProjectDto[]>([]);
  readonly venues = signal<VenueProfileDto[]>([]);
  readonly musicianProfileId = signal<string | null>(null);
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly form = this.fb.nonNullable.group({
    organizerType: ['MUSICIAN', Validators.required],
    organizerProfileId: '',
    type: ['VENUE_DATE', Validators.required],
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    eventName: '',
    proposedDateTime: ['', Validators.required],
    closesAt: '',
    locationText: '',
    genres: ['', Validators.required],
    preferredStyles: '',
    maxSelectedApplicants: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
    offeredConditions: '',
    estimatedPayment: null as number | null,
    currency: 'ARS',
    technicalRequirements: '',
    visibility: ['PUBLIC', Validators.required],
  });

  constructor() {
    this.loadOrganizers();
    if (this.id) this.loadCall(this.id);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    const organizerProfileId = value.organizerProfileId || undefined;
    const input = {
      organizerType: value.organizerType,
      musicianProfileId:
        value.organizerType === 'MUSICIAN'
          ? organizerProfileId || this.musicianProfileId() || undefined
          : undefined,
      bandProjectId: value.organizerType === 'BAND_PROJECT' ? organizerProfileId : undefined,
      venueProfileId: value.organizerType === 'VENUE' ? organizerProfileId : undefined,
      type: value.type,
      title: value.title,
      description: value.description,
      eventName: value.eventName || undefined,
      proposedDateTime: new Date(value.proposedDateTime).toISOString(),
      closesAt: value.closesAt ? new Date(value.closesAt).toISOString() : undefined,
      locationText: value.locationText || undefined,
      genres: this.tags(value.genres),
      preferredStyles: this.tags(value.preferredStyles),
      maxSelectedApplicants: value.maxSelectedApplicants,
      offeredConditions: value.offeredConditions || undefined,
      estimatedPayment: value.estimatedPayment ?? undefined,
      currency: value.estimatedPayment !== null ? value.currency : undefined,
      technicalRequirements: value.technicalRequirements || undefined,
      visibility: value.visibility,
    };
    const updateInput = {
      type: input.type,
      title: input.title,
      description: input.description,
      eventName: input.eventName,
      proposedDateTime: input.proposedDateTime,
      closesAt: input.closesAt,
      locationText: input.locationText,
      genres: input.genres,
      preferredStyles: input.preferredStyles,
      maxSelectedApplicants: input.maxSelectedApplicants,
      offeredConditions: input.offeredConditions,
      estimatedPayment: input.estimatedPayment,
      currency: input.currency,
      technicalRequirements: input.technicalRequirements,
      visibility: input.visibility,
    };
    const request = this.id ? this.calls.update(this.id, updateInput) : this.calls.create(input);
    request.subscribe({
      next: (call) => void this.router.navigate(['/calls', call.id]),
      error: (error: { error?: { message?: string | string[] } }) => {
        const message = error.error?.message;
        this.error.set(
          Array.isArray(message)
            ? message.join(', ')
            : message || 'No pudimos guardar la convocatoria.',
        );
        this.loading.set(false);
      },
    });
  }

  private loadOrganizers(): void {
    this.bandsService
      .getMine()
      .subscribe((bands) => this.bands.set(bands.filter((band) => band.isOwner)));
    this.venuesService.getMine().subscribe((venues) => this.venues.set(venues));
    this.musicianService
      .getMine()
      .subscribe((result) => this.musicianProfileId.set(result.profile?.id ?? null));
  }

  private loadCall(id: string): void {
    this.loading.set(true);
    this.calls.get(id).subscribe({
      next: (call) => {
        this.form.patchValue({
          organizerType: call.organizerType,
          organizerProfileId:
            call.musicianProfile?.id || call.bandProject?.id || call.venueProfile?.id || '',
          type: call.type,
          title: call.title,
          description: call.description,
          eventName: call.eventName || '',
          proposedDateTime: this.localDate(call.proposedDateTime),
          closesAt: call.closesAt ? this.localDate(call.closesAt) : '',
          locationText: call.locationText || '',
          genres: call.genres.join(', '),
          preferredStyles: call.preferredStyles.join(', '),
          maxSelectedApplicants: call.maxSelectedApplicants,
          offeredConditions: call.offeredConditions || '',
          estimatedPayment: call.estimatedPayment ? Number(call.estimatedPayment) : null,
          currency: call.currency || 'ARS',
          technicalRequirements: call.technicalRequirements || '',
          visibility: call.visibility,
        });
        this.form.controls.organizerType.disable();
        this.form.controls.organizerProfileId.disable();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar la convocatoria.');
        this.loading.set(false);
      },
    });
  }

  private tags(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private localDate(value: string): string {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }
}
