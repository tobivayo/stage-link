import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MusicianSearchResultDto, RecommendationDecision } from '@stagelink/shared';
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
import { RecommendationService } from '../../../../core/search/recommendation.service';

@Component({
  selector: 'app-recommendations-page',
  templateUrl: './recommendations-page.component.html',
  styleUrl: '../search-pages.scss',
  imports: [
    RouterLink,
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
export class RecommendationsPageComponent implements OnInit {
  private readonly recommendations = inject(RecommendationService);
  private readonly contacts = inject(ContactIntentService);
  readonly items = signal<MusicianSearchResultDto[]>([]);
  readonly index = signal(0);
  readonly loading = signal(true);
  readonly message = signal<string | null>(null);

  get current(): MusicianSearchResultDto | undefined {
    return this.items()[this.index()];
  }

  ngOnInit(): void {
    this.recommendations.getMusicians().subscribe({
      next: (result) => {
        this.items.set(result.items);
        this.loading.set(false);
      },
      error: () => {
        this.message.set('Completá tu perfil de músico para recibir recomendaciones.');
        this.loading.set(false);
      },
    });
  }

  decide(decision: RecommendationDecision): void {
    const item = this.current;
    if (!item) return;
    this.recommendations.decide(item.id, decision).subscribe({
      next: () => {
        if (decision === 'INTERESTED') {
          this.contacts
            .create({
              targetProfileType: 'MUSICIAN',
              targetProfileId: item.id,
              sourceType: 'RECOMMENDATION',
            })
            .subscribe({ error: () => undefined });
        }
        this.index.update((value) => value + 1);
      },
      error: () => this.message.set('No pudimos guardar tu decisión.'),
    });
  }
}
