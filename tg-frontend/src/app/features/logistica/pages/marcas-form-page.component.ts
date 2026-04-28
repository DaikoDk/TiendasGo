import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { MarcasApiService } from '../services/marcas-api.service';
import { AdminApprovalModalComponent } from '../../../shared/components/admin-approval-modal/admin-approval-modal.component';
import { AppInputComponent } from '../../../shared/ui/app-input/app-input.component';
import { MarcasService } from '../services/marcas.service';

@Component({
  selector: 'app-marcas-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, AppInputComponent, AdminApprovalModalComponent],
  templateUrl: './marcas-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarcasFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly marcasService = inject(MarcasService);
  private readonly marcasApi = inject(MarcasApiService);
  private readonly fb = inject(FormBuilder);

  private readonly routeId = this.parseId(this.route.snapshot.paramMap.get('id'));
  protected readonly isEditMode = signal(this.routeId !== null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly approvalVisible = signal(false);
  protected readonly approvalLoading = signal(false);
  protected readonly approvalError = signal('');
  protected readonly pendingPayload = signal<any | null>(null);

  protected readonly pageTitle = computed(() => (this.isEditMode() ? 'Editar Marca' : 'Nueva Marca'));
  protected readonly submitLabel = computed(() => (this.isEditMode() ? 'Actualizar' : 'Crear'));

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
  });

  constructor() {
    if (this.routeId !== null) {
      this.loadMarca(this.routeId);
    }
  }

  private parseId(value: string | null): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private loadMarca(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.marcasService.getById(id).subscribe({
      next: (marca) => {
        this.form.patchValue({ nombre: marca.nombre });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(this.resolveError(error, 'No se pudo cargar la marca.'));
      }
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      nombre: (raw.nombre ?? '').toString().trim()
    };

    this.pendingPayload.set(payload);
    this.approvalError.set('');
    this.approvalVisible.set(true);
  }

  protected onCancel(): void {
    void this.router.navigate(['/dashboard/logistica/marcas']);
  }

  protected onAdminApproved(credentials: { email: string; password: string }): void {
    this.approvalLoading.set(true);
    this.approvalError.set('');

    this.authService.validateAdminCredentials(credentials).subscribe({
      next: (session) => {
        const payload = this.pendingPayload();
        if (!payload) {
          this.approvalLoading.set(false);
          this.approvalVisible.set(false);
          return;
        }

        const token = (session as any)?.token ?? '';
        if (!token) {
          this.approvalLoading.set(false);
          this.approvalError.set('Respuesta de autenticación sin token.');
          return;
        }

        if (this.isEditMode()) {
          this.updateMarca(this.routeId!, payload, token);
        } else {
          this.createMarca(payload, token);
        }
      },
      error: (error: unknown) => {
        this.approvalLoading.set(false);
        this.approvalError.set(this.resolveError(error, 'Credenciales inválidas.'));
      }
    });
  }

  protected onAdminCancelled(): void {
    this.approvalVisible.set(false);
    this.approvalLoading.set(false);
    this.approvalError.set('');
    this.pendingPayload.set(null);
  }

  private createMarca(payload: { nombre: string }, token: string): void {
    this.marcasApi.crearMarca(payload.nombre, token).subscribe({
      next: () => void this.router.navigate(['/dashboard/logistica/marcas']),
      error: (error: unknown) => {
        this.saving.set(false);
        const httpErr = error as HttpErrorResponse;
        if (httpErr?.status === 401 || httpErr?.status === 403) {
          this.approvalVisible.set(true);
          this.approvalError.set('Se requiere validación ADMIN.');
          return;
        }

        this.approvalVisible.set(false);
        this.error.set(this.resolveError(error, 'No se pudo crear la marca.'));
      }
    });
  }

  private updateMarca(id: number, payload: { nombre: string }, token: string): void {
    this.marcasApi.actualizarMarca(id, payload.nombre, token).subscribe({
      next: () => void this.router.navigate(['/dashboard/logistica/marcas']),
      error: (error: unknown) => {
        this.saving.set(false);
        const httpErr = error as HttpErrorResponse;
        if (httpErr?.status === 401 || httpErr?.status === 403) {
          this.approvalVisible.set(true);
          this.approvalError.set('Se requiere validación ADMIN.');
          return;
        }

        this.approvalVisible.set(false);
        this.error.set(this.resolveError(error, 'No se pudo actualizar la marca.'));
      }
    });
  }

  private resolveError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? error.message ?? fallback;
    }
    return typeof error === 'string' ? error : fallback;
  }
}
