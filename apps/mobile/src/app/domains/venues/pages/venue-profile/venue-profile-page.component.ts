import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Visibility } from '@stagelink/shared';
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
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { VenueProfileService } from '../../../../core/profiles/venue-profile.service';

@Component({
  selector: 'app-venue-profile-page',
  templateUrl: './venue-profile-page.component.html',
  styleUrl: '../../../profiles/pages/profile-pages.scss',
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
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VenueProfilePageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly service = inject(VenueProfileService);
  readonly id = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly visibility = Object.values(Visibility);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    description: '',
    capacity: [0, Validators.min(1)],
    genres: '',
    equipment: '',
    availabilityNotes: '',
    addressLine1: ['', Validators.required],
    city: ['', Validators.required],
    region: '',
    postalCode: '',
    countryCode: ['AR', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactVisibility: Visibility.Private,
    addressVisibility: Visibility.RegisteredOnly,
    visibility: Visibility.Public,
    linkLabel: '',
    linkUrl: '',
  });
  ngOnInit(): void {
    this.service.getMine().subscribe((profiles) => {
      const profile = profiles[0];
      if (!profile) return;
      this.id.set(profile.id);
      this.form.patchValue({
        name: profile.name,
        description: profile.description ?? '',
        capacity: profile.capacity ?? 0,
        genres: profile.genres.join(', '),
        equipment: profile.equipment.join(', '),
        availabilityNotes: profile.availability?.notes ?? '',
        addressLine1: profile.location?.addressLine1 ?? '',
        city: profile.location?.city ?? '',
        region: profile.location?.region ?? '',
        postalCode: profile.location?.postalCode ?? '',
        countryCode: profile.location?.countryCode ?? 'AR',
        visibility: profile.visibility,
        contactName: profile.contactName ?? '',
        contactEmail: profile.contactEmail ?? '',
        contactPhone: profile.contactPhone ?? '',
        contactVisibility: profile.contactVisibility ?? Visibility.Private,
        addressVisibility: profile.addressVisibility ?? Visibility.RegisteredOnly,
        linkLabel: profile.links?.[0]?.label ?? '',
        linkUrl: profile.links?.[0]?.url ?? '',
      });
    });
  }
  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const { availabilityNotes, linkLabel, linkUrl, ...value } = this.form.getRawValue();
    const input = {
      name: value.name,
      description: value.description || undefined,
      capacity: value.capacity || undefined,
      genres: this.tags(value.genres),
      equipment: this.tags(value.equipment),
      availability: availabilityNotes ? { notes: availabilityNotes } : undefined,
      contactName: value.contactName || undefined,
      contactEmail: value.contactEmail || undefined,
      contactPhone: value.contactPhone || undefined,
      contactVisibility: value.contactVisibility,
      addressVisibility: value.addressVisibility,
      visibility: value.visibility,
      links: linkUrl
        ? [{ label: linkLabel || 'Enlace', url: linkUrl, visibility: Visibility.Public }]
        : [],
      location: {
        addressLine1: value.addressLine1,
        city: value.city,
        region: value.region || undefined,
        postalCode: value.postalCode || undefined,
        countryCode: value.countryCode,
      },
    };
    const request = this.id() ? this.service.update(this.id()!, input) : this.service.create(input);
    request.subscribe({
      next: (profile) => {
        this.id.set(profile.id);
        this.message.set('Venue guardado.');
      },
      error: () => this.message.set('No pudimos guardar el venue. Revisá el rol y los datos.'),
    });
  }
  private tags(value: string): string[] {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}
