import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import type { BandProjectDto } from '@stagelink/shared';
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
import { MemberSearchService } from '../../../../core/search/member-search.service';

@Component({
  selector: 'app-member-search-editor-page',
  templateUrl: './member-search-editor-page.component.html',
  styleUrl: '../search-pages.scss',
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
export class MemberSearchEditorPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly service = inject(MemberSearchService);
  private readonly bandsService = inject(BandProjectService);
  private readonly router = inject(Router);
  readonly bands = signal<BandProjectDto[]>([]);
  readonly message = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    bandProjectId: '',
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    requiredInstrument: ['', Validators.required],
    genres: ['', Validators.required],
    desiredExperience: '',
    expectedAvailability: '',
    locationText: '',
    modality: 'IN_PERSON',
    visibility: Visibility.Public,
  });
  ngOnInit(): void {
    this.bandsService
      .getMine()
      .subscribe((bands) => this.bands.set(bands.filter((band) => band.isOwner)));
  }
  save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    this.service
      .create({
        ...value,
        bandProjectId: value.bandProjectId || undefined,
        desiredExperience: value.desiredExperience || undefined,
        expectedAvailability: value.expectedAvailability || undefined,
        locationText: value.locationText || undefined,
        genres: value.genres
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      })
      .subscribe({
        next: (item) => void this.router.navigate(['/member-searches', item.id]),
        error: () =>
          this.message.set(
            'No pudimos publicar. Verificá tu perfil o la administración de la banda.',
          ),
      });
  }
}
