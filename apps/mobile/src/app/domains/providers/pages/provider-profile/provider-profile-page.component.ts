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

import { ProviderProfileService } from '../../../../core/profiles/provider-profile.service';

@Component({
  selector: 'app-provider-profile-page',
  templateUrl: './provider-profile-page.component.html',
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
export class ProviderProfilePageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly service = inject(ProviderProfileService);
  readonly id = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly visibility = Object.values(Visibility);
  readonly form = this.formBuilder.nonNullable.group({
    businessName: ['', Validators.required],
    description: '',
    serviceTags: ['', Validators.required],
    coverageArea: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactVisibility: Visibility.Private,
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
        businessName: profile.businessName,
        description: profile.description ?? '',
        serviceTags: profile.serviceTags.join(', '),
        coverageArea: profile.coverageArea ?? '',
        visibility: profile.visibility,
        contactName: profile.contactName ?? '',
        contactEmail: profile.contactEmail ?? '',
        contactPhone: profile.contactPhone ?? '',
        contactVisibility: profile.contactVisibility ?? Visibility.Private,
        linkLabel: profile.links?.[0]?.label ?? '',
        linkUrl: profile.links?.[0]?.url ?? '',
      });
    });
  }
  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const { linkLabel, linkUrl, ...value } = this.form.getRawValue();
    const input = {
      ...value,
      description: value.description || undefined,
      serviceTags: value.serviceTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      coverageArea: value.coverageArea || undefined,
      contactName: value.contactName || undefined,
      contactEmail: value.contactEmail || undefined,
      contactPhone: value.contactPhone || undefined,
      links: linkUrl
        ? [{ label: linkLabel || 'Enlace', url: linkUrl, visibility: Visibility.Public }]
        : [],
    };
    const request = this.id() ? this.service.update(this.id()!, input) : this.service.create(input);
    request.subscribe({
      next: (profile) => {
        this.id.set(profile.id);
        this.message.set('Perfil de proveedor guardado.');
      },
      error: () => this.message.set('No pudimos guardar el perfil. Revisá el rol y los datos.'),
    });
  }
}
