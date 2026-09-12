import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import type { RoleCode, UserRoleDto } from '@stagelink/shared';
import { Visibility } from '@stagelink/shared';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';
import { forkJoin } from 'rxjs';

import { PreferencesService } from '../../../../core/preferences/preferences.service';
import { type AvailableRole, RoleService } from '../../../../core/roles/role.service';

@Component({
  selector: 'app-role-preferences-page',
  templateUrl: './role-preferences-page.component.html',
  styleUrl: './role-preferences-page.component.scss',
  imports: [
    ReactiveFormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToggle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolePreferencesPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly rolesService = inject(RoleService);
  private readonly preferencesService = inject(PreferencesService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly availableRoles = signal<AvailableRole[]>([]);
  readonly userRoles = signal<UserRoleDto[]>([]);
  readonly visibilityOptions = Object.values(Visibility);
  readonly form = this.formBuilder.nonNullable.group({
    internalNotificationsEnabled: true,
    pushNotificationsEnabled: true,
    emailNotificationsEnabled: true,
    defaultVisibility: Visibility.RegisteredOnly,
    contactAvailability: true,
  });

  ngOnInit(): void {
    forkJoin({
      available: this.rolesService.getAvailable(),
      mine: this.rolesService.getMine(),
      preferences: this.preferencesService.getMine(),
    }).subscribe({
      next: ({ available, mine, preferences }) => {
        this.availableRoles.set(available.filter((role) => role.canSelfManage));
        this.userRoles.set(mine);
        this.form.patchValue(preferences);
        this.loading.set(false);
      },
      error: () => {
        this.message.set('No pudimos cargar la configuración.');
        this.loading.set(false);
      },
    });
  }

  assignmentFor(code: RoleCode): UserRoleDto | undefined {
    return this.userRoles().find((assignment) => assignment.code === code);
  }

  requestRole(code: RoleCode): void {
    this.saving.set(true);
    this.rolesService.requestActivation(code).subscribe({
      next: (assignment) => {
        this.replaceAssignment(assignment);
        this.message.set('Rol solicitado. Quedó pendiente de completar el perfil en PT-03.');
        this.saving.set(false);
      },
      error: () => {
        this.message.set('No pudimos solicitar el rol.');
        this.saving.set(false);
      },
    });
  }

  deactivateRole(code: RoleCode): void {
    this.saving.set(true);
    this.rolesService.deactivate(code).subscribe({
      next: (assignment) => {
        this.replaceAssignment(assignment);
        this.message.set('Rol desactivado.');
        this.saving.set(false);
      },
      error: () => {
        this.message.set('No pudimos desactivar el rol.');
        this.saving.set(false);
      },
    });
  }

  savePreferences(): void {
    this.saving.set(true);
    this.preferencesService.updateMine(this.form.getRawValue()).subscribe({
      next: () => {
        this.message.set('Preferencias guardadas.');
        this.saving.set(false);
      },
      error: () => {
        this.message.set('No pudimos guardar las preferencias.');
        this.saving.set(false);
      },
    });
  }

  private replaceAssignment(updated: UserRoleDto): void {
    const assignments = this.userRoles().filter((item) => item.code !== updated.code);
    this.userRoles.set([...assignments, updated]);
  }
}
