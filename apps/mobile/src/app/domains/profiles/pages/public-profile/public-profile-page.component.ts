import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { PublicProfileDto } from '@stagelink/shared';
import { IonContent, IonHeader, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular';

import { PublicProfileService } from '../../../../core/profiles/public-profile.service';

@Component({
  selector: 'app-public-profile-page',
  templateUrl: './public-profile-page.component.html',
  styleUrl: '../profile-pages.scss',
  imports: [IonContent, IonHeader, IonSpinner, IonTitle, IonToolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicProfilePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PublicProfileService);
  readonly profile = signal<PublicProfileDto | null>(null);
  readonly error = signal(false);
  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type') ?? '';
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.service.get(type, id).subscribe({
      next: (profile) => this.profile.set(profile),
      error: () => this.error.set(true),
    });
  }
}
