import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { MusicianSearchResultDto } from '@stagelink/shared';
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
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';

import { MusicianSearchService } from '../../../../core/search/musician-search.service';

@Component({
  selector: 'app-musician-search-page',
  templateUrl: './musician-search-page.component.html',
  styleUrl: '../search-pages.scss',
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
    IonTitle,
    IonToggle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusicianSearchPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly searchService = inject(MusicianSearchService);
  readonly items = signal<MusicianSearchResultDto[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly hasMore = signal(false);
  readonly error = signal<string | null>(null);
  private page = 1;
  readonly form = this.formBuilder.nonNullable.group({
    query: '',
    instrument: '',
    genre: '',
    location: '',
    available: false,
    experienceLevel: '',
    influence: '',
    sort: 'COMPATIBILITY' as const,
  });

  search(reset = true): void {
    if (reset) this.page = 1;
    this.loading.set(true);
    this.error.set(null);
    const values = this.form.getRawValue();
    this.searchService
      .search({
        ...values,
        available: values.available ? true : undefined,
        page: this.page,
        limit: 10,
      })
      .subscribe({
        next: (result) => {
          this.items.set(reset ? result.items : [...this.items(), ...result.items]);
          this.hasMore.set(result.hasMore);
          this.searched.set(true);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No pudimos completar la búsqueda.');
          this.loading.set(false);
        },
      });
  }

  loadMore(): void {
    this.page += 1;
    this.search(false);
  }
}
