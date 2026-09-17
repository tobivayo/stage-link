import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { MemberSearchDto } from '@stagelink/shared';
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
  IonToolbar,
} from '@ionic/angular';

import { MemberSearchService } from '../../../../core/search/member-search.service';

@Component({
  selector: 'app-member-searches-page',
  templateUrl: './member-searches-page.component.html',
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
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberSearchesPageComponent implements OnInit {
  private readonly service = inject(MemberSearchService);
  private readonly formBuilder = inject(FormBuilder);
  readonly items = signal<MemberSearchDto[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(false);
  readonly error = signal<string | null>(null);
  private page = 1;
  readonly form = this.formBuilder.nonNullable.group({
    instrument: '',
    genre: '',
    location: '',
    modality: '',
  });

  ngOnInit(): void {
    this.load();
  }

  load(reset = true): void {
    if (reset) this.page = 1;
    this.loading.set(true);
    this.error.set(null);
    this.service.list({ ...this.form.getRawValue(), page: this.page, limit: 10 }).subscribe({
      next: (result) => {
        this.items.set(reset ? result.items : [...this.items(), ...result.items]);
        this.hasMore.set(result.hasMore);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar las búsquedas.');
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    this.page += 1;
    this.load(false);
  }
}
