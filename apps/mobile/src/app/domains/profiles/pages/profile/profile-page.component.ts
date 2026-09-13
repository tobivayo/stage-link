import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MyProfilesDto } from '@stagelink/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { ProfileService } from '../../../../core/profiles/profile.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrl: '../profile-pages.scss',
  imports: [
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  private readonly profilesService = inject(ProfileService);
  readonly data = signal<MyProfilesDto | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.profilesService.getMine().subscribe({
      next: (data) => this.data.set(data),
      error: () => this.error.set('No pudimos cargar tus perfiles.'),
    });
  }

  hasRole(code: string): boolean {
    return !!this.data()?.roles.some((assignment) => assignment.role.code === code);
  }
}
