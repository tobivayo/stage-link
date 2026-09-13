import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';

import { MusicianProfileService } from '../../../../core/profiles/musician-profile.service';

@Component({
  selector: 'app-musician-profile-page',
  templateUrl: './musician-profile-page.component.html',
  styleUrl: '../profile-pages.scss',
  imports: [
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
    IonToggle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusicianProfilePageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly service = inject(MusicianProfileService);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly existing = signal(false);
  readonly message = signal<string | null>(null);
  readonly visibility = Object.values(Visibility);
  readonly form = this.formBuilder.nonNullable.group({
    stageName: '',
    bio: '',
    instruments: ['', Validators.required],
    genres: ['', Validators.required],
    influences: '',
    experience: '',
    previousProjects: '',
    availableForProjects: false,
    isSoloProject: true,
    locationText: '',
    photoUrl: '',
    visibility: Visibility.Public,
    locationVisibility: Visibility.RegisteredOnly,
    linkLabel: '',
    linkUrl: '',
  });

  ngOnInit(): void {
    this.service.getMine().subscribe({
      next: ({ profile }) => {
        if (profile) {
          this.existing.set(true);
          this.form.patchValue({
            ...profile,
            instruments: profile.instruments.join(', '),
            genres: profile.genres.join(', '),
            influences: profile.influences.join(', '),
            previousProjects: profile.previousProjects.join(', '),
            stageName: profile.stageName ?? '',
            bio: profile.bio ?? '',
            experience: profile.experience ?? '',
            locationText: profile.locationText ?? '',
            photoUrl: profile.photoUrl ?? '',
            linkLabel: profile.links[0]?.label ?? '',
            linkUrl: profile.links[0]?.url ?? '',
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.message.set('Activá primero el rol MUSICIAN desde Roles y preferencias.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.saving.set(true);
    const { linkLabel, linkUrl, ...value } = this.form.getRawValue();
    const input = {
      ...value,
      instruments: this.tags(value.instruments),
      genres: this.tags(value.genres),
      influences: this.tags(value.influences),
      previousProjects: this.tags(value.previousProjects),
      photoUrl: value.photoUrl || undefined,
      locationText: value.locationText || undefined,
      links: linkUrl
        ? [{ label: linkLabel || 'Enlace', url: linkUrl, visibility: Visibility.Public }]
        : [],
    };
    const request = this.existing() ? this.service.update(input) : this.service.create(input);
    request.subscribe({
      next: () => {
        this.existing.set(true);
        this.message.set('Perfil guardado.');
        this.saving.set(false);
      },
      error: () => {
        this.message.set('No pudimos guardar el perfil. Revisá los datos y tu rol.');
        this.saving.set(false);
      },
    });
  }

  private tags(value: string): string[] {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}
