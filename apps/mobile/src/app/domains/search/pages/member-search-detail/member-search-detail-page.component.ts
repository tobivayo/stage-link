import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type {
  MemberSearchApplicationDto,
  MemberSearchDto,
  MemberSearchApplicationStatus,
} from '@stagelink/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { MemberSearchApplicationService } from '../../../../core/search/member-search-application.service';
import { MemberSearchService } from '../../../../core/search/member-search.service';
import { ContactIntentService } from '../../../../core/search/contact-intent.service';

@Component({
  selector: 'app-member-search-detail-page',
  templateUrl: './member-search-detail-page.component.html',
  styleUrl: '../search-pages.scss',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonSpinner,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberSearchDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly searches = inject(MemberSearchService);
  private readonly applications = inject(MemberSearchApplicationService);
  private readonly contacts = inject(ContactIntentService);
  private readonly formBuilder = inject(FormBuilder);
  readonly search = signal<MemberSearchDto | null>(null);
  readonly received = signal<MemberSearchApplicationDto[]>([]);
  readonly message = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({ message: '' });
  private id = '';
  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.searches.get(this.id).subscribe({
      next: (search) => {
        this.search.set(search);
        if (search.view === 'OWNER') this.loadReceived();
      },
      error: () => this.message.set('La búsqueda no está disponible.'),
    });
  }
  apply(): void {
    this.applications.apply(this.id, this.form.getRawValue().message).subscribe({
      next: () => this.message.set('Postulación enviada.'),
      error: () =>
        this.message.set('No pudimos postularte. Revisá tu perfil o una postulación previa.'),
    });
  }
  close(): void {
    this.searches.close(this.id).subscribe((search) => this.search.set(search));
  }
  review(application: MemberSearchApplicationDto, status: MemberSearchApplicationStatus): void {
    this.applications.updateStatus(application.id, status).subscribe(() => this.loadReceived());
  }
  contact(application: MemberSearchApplicationDto): void {
    this.contacts
      .create({
        targetProfileType: 'MUSICIAN',
        targetProfileId: application.musicianProfile.id,
        sourceType: 'APPLICATION',
        sourceEntityId: application.id,
      })
      .subscribe({
        next: () => this.message.set('Intención de contacto registrada.'),
        error: () =>
          this.message.set('No se pudo registrar el contacto o ya existe uno pendiente.'),
      });
  }
  private loadReceived(): void {
    this.applications.getReceived(this.id).subscribe((items) => this.received.set(items));
  }
}
