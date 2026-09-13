import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import type { BandMemberDto } from '@stagelink/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { BandProjectService } from '../../../../core/bands/band-project.service';

@Component({
  selector: 'app-band-members-page',
  templateUrl: './band-members-page.component.html',
  styleUrl: '../../../profiles/pages/profile-pages.scss',
  imports: [
    ReactiveFormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BandMembersPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly service = inject(BandProjectService);
  readonly bandId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  readonly members = signal<BandMemberDto[]>([]);
  readonly message = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['MEMBER' as 'MEMBER' | 'REPRESENTATIVE'],
    instrument: '',
  });
  ngOnInit(): void {
    this.reload();
  }
  invite(): void {
    if (this.form.invalid) return;
    this.service.invite(this.bandId, this.form.getRawValue()).subscribe({
      next: () => {
        this.message.set('Invitación creada.');
        this.form.reset({ email: '', role: 'MEMBER', instrument: '' });
      },
      error: () => this.message.set('No pudimos crear la invitación.'),
    });
  }
  remove(memberId: string): void {
    this.service.removeMember(this.bandId, memberId).subscribe(() => this.reload());
  }
  private reload(): void {
    this.service.getMembers(this.bandId).subscribe((members) => this.members.set(members));
  }
}
