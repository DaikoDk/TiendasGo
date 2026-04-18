import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/services/auth.service';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppInputComponent } from '../../../shared/ui/app-input/app-input.component';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    AppButtonComponent,
    AppCardComponent,
    AppInputComponent
  ],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.controls.email.value;
    const password = this.form.controls.password.value;

    if (!email || !password) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService
      .login({ email, password })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl(this.resolveReturnUrl());
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error));
        }
      });
  }

  private resolveReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl')?.trim() ?? '';

    if (returnUrl.length === 0) {
      return '/dashboard';
    }

    // Only allow internal dashboard routes to avoid unexpected redirects.
    if (!returnUrl.startsWith('/dashboard')) {
      return '/dashboard';
    }

    return returnUrl;
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Credenciales incorrectas.';
      }

      if (error.status === 403) {
        return 'Tu usuario no tiene permisos para ingresar.';
      }
    }

    return 'No se pudo iniciar sesion. Intenta nuevamente.';
  }
}
