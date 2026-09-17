import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { PublicProfileDto } from '@stagelink/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { ContactIntentService } from '../../../../core/search/contact-intent.service';
import { MusicianSearchService } from '../../../../core/search/musician-search.service';

@Component({
  selector: 'app-musician-search-detail-page',
  templateUrl: './musician-search-detail-page.component.html',
  styleUrl: '../search-pages.scss',
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusicianSearchDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly searchService = inject(MusicianSearchService);
  private readonly contactService = inject(ContactIntentService);
  readonly profile = signal<PublicProfileDto | null>(null);
  readonly message = signal<string | null>(null);
  private id = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.searchService.getPublic(this.id).subscribe({
      next: (profile) => this.profile.set(profile),
      error: () => this.message.set('El perfil no está disponible.'),
    });
  }

  contact(): void {
    this.contactService
      .create({
        targetProfileType: 'MUSICIAN',
        targetProfileId: this.id,
        sourceType: 'SEARCH_RESULT',
      })
      .subscribe({
        next: () => this.message.set('Interés de contacto registrado.'),
        error: () =>
          this.message.set('No se pudo registrar el contacto o ya existe uno pendiente.'),
      });
  }
}
