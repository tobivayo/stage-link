import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { MyProfilesDto, PortfolioItemDto } from '@stagelink/shared';
import { Visibility } from '@stagelink/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { forkJoin } from 'rxjs';

import { PortfolioService } from '../../../../core/portfolio/portfolio.service';
import { ProfileService } from '../../../../core/profiles/profile.service';

@Component({
  selector: 'app-portfolio-page',
  templateUrl: './portfolio-page.component.html',
  styleUrl: '../profile-pages.scss',
  imports: [
    ReactiveFormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly portfolioService = inject(PortfolioService);
  private readonly profileService = inject(ProfileService);
  readonly items = signal<PortfolioItemDto[]>([]);
  readonly profiles = signal<MyProfilesDto | null>(null);
  readonly message = signal<string | null>(null);
  readonly types = ['IMAGE', 'VIDEO', 'AUDIO', 'LINK', 'DOCUMENT'];
  readonly visibility = Object.values(Visibility);
  readonly form = this.formBuilder.nonNullable.group({
    profileKey: ['', Validators.required],
    type: ['LINK', Validators.required],
    title: ['', Validators.required],
    description: '',
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\//)]],
    experienceRef: '',
    visibility: Visibility.Public,
  });
  ngOnInit(): void {
    this.reload();
  }
  add(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    const [profileType, profileId] = value.profileKey.split(':');
    if (!profileType || !profileId) return;
    this.portfolioService
      .create({
        profileType,
        profileId,
        type: value.type,
        title: value.title,
        description: value.description || undefined,
        url: value.url,
        experienceRef: value.experienceRef || undefined,
        visibility: value.visibility,
      })
      .subscribe({
        next: () => {
          this.form.patchValue({ title: '', description: '', url: '', experienceRef: '' });
          this.message.set('Material agregado.');
          this.reload();
        },
        error: () => this.message.set('No pudimos agregar el material.'),
      });
  }
  remove(id: string): void {
    this.portfolioService.remove(id).subscribe(() => this.reload());
  }
  private reload(): void {
    forkJoin({
      items: this.portfolioService.getMine(),
      profiles: this.profileService.getMine(),
    }).subscribe(({ items, profiles }) => {
      this.items.set(items);
      this.profiles.set(profiles);
    });
  }
}
