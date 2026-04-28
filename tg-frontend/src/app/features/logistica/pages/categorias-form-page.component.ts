import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, debounceTime, distinctUntilChanged, switchMap, catchError, of, tap } from 'rxjs';

import { AdminApprovalModalComponent } from '../../../shared/components/admin-approval-modal/admin-approval-modal.component';
import { AppInputComponent } from '../../../shared/ui/app-input/app-input.component';
import { CategoriasService } from '../services/categorias.service';
import { CategoriasApiService } from '../services/categorias-api.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { CategoriaRequest, CategoriaResponse } from '../models/categoria.models';

@Component({
  selector: 'app-categorias-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, AppInputComponent, AdminApprovalModalComponent],
  templateUrl: './categorias-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriasFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly categoriasService = inject(CategoriasService);
  private readonly categoriasApi = inject(CategoriasApiService);
  private readonly authService = inject(AuthService);

  private readonly routeId = this.parseId(this.route.snapshot.paramMap.get('id'));
  protected readonly isEditMode = signal(this.routeId !== null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly approvalVisible = signal(false);
  protected readonly approvalLoading = signal(false);
  protected readonly approvalError = signal('');
  protected readonly pendingPayload = signal<CategoriaRequest | null>(null);

  protected readonly pageTitle = computed(() => (this.isEditMode() ? 'Editar Categoría' : 'Nueva Categoría'));
  protected readonly submitLabel = computed(() => (this.isEditMode() ? 'Actualizar' : 'Crear'));

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    prefijo: [{ value: '', disabled: true }]
  });

  constructor() {
    if (this.routeId !== null) {
      this.loadCategoria(this.routeId);
    }
  }

  private parseId(value: string | null): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private loadCategoria(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.categoriasService.getCategoriaById(id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (cat) => {
        this.form.patchValue({ nombre: cat.nombre, prefijo: cat.prefijo ?? '' });
      },
      error: (err: unknown) => this.error.set(this.resolveError(err, 'No se pudo cargar la categoría.'))
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: CategoriaRequest = {
      nombre: (raw.nombre ?? '').toString().trim()
    };

    this.pendingPayload.set(payload);
    this.approvalError.set('');
    this.approvalVisible.set(true);
  }

  protected onCancel(): void {
    void this.router.navigate(['/dashboard/logistica/categorias']);
  }

  protected onAdminApproved(credentials: { email: string; password: string }): void {
    const payload = this.pendingPayload();
    if (!payload) return;

    this.approvalLoading.set(true);
    this.approvalError.set('');

    this.authService.validateAdminCredentials(credentials).subscribe({
      next: (session) => {
        const token = (session as any)?.token ?? '';
        if (!token) {
          this.approvalLoading.set(false);
          this.approvalError.set('Respuesta de autenticación sin token.');
          return;
        }

        if (this.isEditMode()) {
          this.updateCategoria(this.routeId!, payload, token);
        } else {
          this.createCategoria(payload, token);
        }
      },
      error: (err: unknown) => {
        this.approvalLoading.set(false);
        this.approvalError.set(this.resolveError(err, 'Credenciales inválidas.'));
      }
    });
  }

  protected onAdminCancelled(): void {
    this.approvalVisible.set(false);
    this.approvalLoading.set(false);
    this.approvalError.set('');
    this.pendingPayload.set(null);
  }

  private createCategoria(payload: CategoriaRequest, token: string): void {
    this.categoriasApi.crearCategoria(payload, token).subscribe({
      next: () => void this.router.navigate(['/dashboard/logistica/categorias']),
      error: (err: unknown) => {
        const httpErr = err as HttpErrorResponse;
        if (httpErr?.status === 401 || httpErr?.status === 403) {
          this.approvalVisible.set(true);
          this.approvalError.set('Se requiere validación ADMIN.');
          return;
        }

        this.approvalVisible.set(false);
        this.error.set(this.resolveError(err, 'No se pudo crear la categoría.'));
      }
    });
  }

  private updateCategoria(id: number, payload: CategoriaRequest, token: string): void {
    this.categoriasApi.actualizarCategoria(id, payload, token).subscribe({
      next: () => void this.router.navigate(['/dashboard/logistica/categorias']),
      error: (err: unknown) => {
        const httpErr = err as HttpErrorResponse;
        if (httpErr?.status === 401 || httpErr?.status === 403) {
          this.approvalVisible.set(true);
          this.approvalError.set('Se requiere validación ADMIN.');
          return;
        }

        this.approvalVisible.set(false);
        this.error.set(this.resolveError(err, 'No se pudo actualizar la categoría.'));
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
