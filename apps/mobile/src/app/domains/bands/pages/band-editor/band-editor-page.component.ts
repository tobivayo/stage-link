import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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

import { BandProjectService } from '../../../../core/bands/band-project.service';

@Component({
  selector: 'app-band-editor-page',
  templateUrl: './band-editor-page.component.html',
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
export class BandEditorPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(BandProjectService);
  readonly bandId = this.route.snapshot.paramMap.get('id');
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly visibility = Object.values(Visibility);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    description: '',
    genres: ['', Validators.required],
    influences: '',
    locationText: '',
    imageUrl: '',
    visibility: Visibility.Public,
    locationVisibility: Visibility.RegisteredOnly,
    linkLabel: '',
    linkUrl: '',
  });

  ngOnInit(): void {
    if (!this.bandId) return;
    this.service.get(this.bandId).subscribe((band) =>
      this.form.patchValue({
        name: band.name,
        description: band.description ?? '',
        genres: band.genres.join(', '),
        influences: band.influences.join(', '),
        locationText: band.locationText ?? '',
        imageUrl: band.imageUrl ?? '',
        visibility: band.visibility,
        locationVisibility: band.locationVisibility,
        linkLabel: band.links?.[0]?.label ?? '',
        linkUrl: band.links?.[0]?.url ?? '',
      }),
    );
  }

  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.saving.set(true);
    const { linkLabel, linkUrl, ...value } = this.form.getRawValue();
    const input = {
      ...value,
      genres: this.tags(value.genres),
      influences: this.tags(value.influences),
      locationText: value.locationText || undefined,
      imageUrl: value.imageUrl || undefined,
      links: linkUrl
        ? [{ label: linkLabel || 'Enlace', url: linkUrl, visibility: Visibility.Public }]
        : [],
    };
    const request = this.bandId
      ? this.service.update(this.bandId, input)
      : this.service.create(input);
    request.subscribe({
      next: (band) => void this.router.navigate(['/profile/bands', band.id, 'members']),
      error: () => {
        this.message.set('No pudimos guardar el proyecto. Revisá tu rol y los datos.');
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
