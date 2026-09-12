import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonInput,
  IonItem,
  IonSpinner,
  IonText,
} from '@ionic/angular';

import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrl: '../auth-page.scss',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonCheckbox,
    IonContent,
    IonInput,
    IonItem,
    IonSpinner,
    IonText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    locationText: ['', Validators.maxLength(160)],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
      ],
    ],
    termsAccepted: [false, Validators.requiredTrue],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .register({
        ...value,
        locationText: value.locationText || undefined,
        termsAccepted: true,
      })
      .subscribe({
        next: () => void this.router.navigateByUrl('/dashboard'),
        error: () => {
          this.error.set('No pudimos crear la cuenta. El email podría estar registrado.');
          this.loading.set(false);
        },
      });
  }
}
