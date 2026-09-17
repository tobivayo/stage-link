import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MemberSearchDto } from '@stagelink/shared';
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

import { MemberSearchService } from '../../../../core/search/member-search.service';

@Component({
  selector: 'app-my-member-searches-page',
  templateUrl: './my-member-searches-page.component.html',
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
export class MyMemberSearchesPageComponent implements OnInit {
  private readonly service = inject(MemberSearchService);
  readonly items = signal<MemberSearchDto[] | null>(null);
  ngOnInit(): void {
    this.service
      .getMine()
      .subscribe({ next: (items) => this.items.set(items), error: () => this.items.set([]) });
  }
}
