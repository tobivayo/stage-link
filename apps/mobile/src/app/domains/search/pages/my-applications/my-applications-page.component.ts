import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MemberSearchApplicationDto } from '@stagelink/shared';
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

import { MemberSearchApplicationService } from '../../../../core/search/member-search-application.service';

@Component({
  selector: 'app-my-applications-page',
  templateUrl: './my-applications-page.component.html',
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
export class MyApplicationsPageComponent implements OnInit {
  private readonly service = inject(MemberSearchApplicationService);
  readonly items = signal<MemberSearchApplicationDto[] | null>(null);
  ngOnInit(): void {
    this.load();
  }
  cancel(id: string): void {
    this.service.updateStatus(id, 'CANCELLED').subscribe(() => this.load());
  }
  private load(): void {
    this.service
      .getMine()
      .subscribe({ next: (items) => this.items.set(items), error: () => this.items.set([]) });
  }
}
