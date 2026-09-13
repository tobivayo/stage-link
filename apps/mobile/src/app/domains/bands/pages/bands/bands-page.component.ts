import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { BandInvitationDto, BandProjectDto } from '@stagelink/shared';
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
import { forkJoin } from 'rxjs';

import { BandProjectService } from '../../../../core/bands/band-project.service';

@Component({
  selector: 'app-bands-page',
  templateUrl: './bands-page.component.html',
  styleUrl: '../../../profiles/pages/profile-pages.scss',
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
export class BandsPageComponent implements OnInit {
  private readonly service = inject(BandProjectService);
  readonly bands = signal<BandProjectDto[]>([]);
  readonly invitations = signal<BandInvitationDto[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.reload();
  }

  respond(id: string, accept: boolean): void {
    this.service.respond(id, accept).subscribe(() => this.reload());
  }

  private reload(): void {
    forkJoin({
      bands: this.service.getMine(),
      invitations: this.service.getMyInvitations(),
    }).subscribe({
      next: ({ bands, invitations }) => {
        this.bands.set(bands);
        this.invitations.set(invitations);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
