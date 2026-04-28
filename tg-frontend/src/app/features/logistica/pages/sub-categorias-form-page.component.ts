import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AdminApprovalModalComponent } from '../../../shared/components/admin-approval-modal/admin-approval-modal.component';
import { AppInputComponent } from '../../../shared/ui/app-input/app-input.component';
import { CategoriasService } from '../services/categorias.service';
import { CategoriasApiService } from '../services/categorias-api.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { SubCategoriaRequest, SubCategoriaResponse } from '../models/subcategoria.models';

@Component({
  selector: 'app-sub-categorias-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, AppInputComponent, AdminApprovalModalComponent],
  templateUrl: './sub-categorias-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubCategoriasFormPageComponent {
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
  protected readonly pendingPayload = signal<SubCategoriaRequest | null>(null);

  protected readonly pageTitle = computed(() => (this.isEditMode() ? 'Editar Subcategoría' : 'Nueva Subcategoría'));
  protected readonly submitLabel = computed(() => (this.isEditMode() ? 'Actualizar' : 'Crear'));

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    idCategoria: [null, [Validators.required]]
  });

  protected readonly categoriasActivas = signal<{ id: number; nombre: string }[]>([]);

  constructor() {
    this.loadCategoriasActivas();
    if (this.routeId !== null) {
      this.loadSubCategoria(this.routeId);
    }
  }

  private parseId(value: string | null): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private loadCategoriasActivas(): void {
    this.categoriasService.getAllCategorias().pipe(finalize(() => {})).subscribe({
      next: (list) => this.categoriasActivas.set(list.filter((c) => (c.estado ?? true)).map((c) => ({ id: c.id, nombre: c.nombre }))),
      error: () => this.categoriasActivas.set([])
    });
  }

  private loadSubCategoria(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.categoriasService.getSubCategoriaById(id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (s) => {
        this.form.patchValue({ nombre: s.nombre });
        const ctrl = this.form.get('idCategoria');
        if (ctrl) {
          (ctrl as any).setValue(s.idCategoria);
        }
      },
      error: (err: unknown) => this.error.set(this.resolveError(err, 'No se pudo cargar la subcategoría.'))
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: SubCategoriaRequest = {
      nombre: (raw.nombre ?? '').toString().trim(),
      idCategoria: Number(raw.idCategoria)
    };

    this.pendingPayload.set(payload);
    this.approvalError.set('');
    this.approvalVisible.set(true);
  }

  protected onCancel(): void {
    void this.router.navigate(['/dashboard/logistica/sub-categorias']);
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
          this.updateSubCategoria(this.routeId!, payload, token);
        } else {
          this.createSubCategoria(payload, token);
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

  private createSubCategoria(payload: SubCategoriaRequest, token: string): void {
    this.categoriasApi.crearSubCategoria(payload, token).subscribe({
      next: () => void this.router.navigate(['/dashboard/logistica/sub-categorias']),
      error: (err: unknown) => {
        const httpErr = err as HttpErrorResponse;
        if (httpErr?.status === 401 || httpErr?.status === 403) {
          this.approvalVisible.set(true);
          this.approvalError.set('Se requiere validación ADMIN.');
          return;
        }

        this.approvalVisible.set(false);
        this.error.set(this.resolveError(err, 'No se pudo crear la subcategoría.'));
      }
    });
  }

  private updateSubCategoria(id: number, payload: SubCategoriaRequest, token: string): void {
    this.categoriasApi.actualizarSubCategoria(id, payload, token).subscribe({
      next: () => void this.router.navigate(['/dashboard/logistica/sub-categorias']),
      error: (err: unknown) => {
        const httpErr = err as HttpErrorResponse;
        if (httpErr?.status === 401 || httpErr?.status === 403) {
          this.approvalVisible.set(true);
          this.approvalError.set('Se requiere validación ADMIN.');
          return;
        }

        this.approvalVisible.set(false);
        this.error.set(this.resolveError(err, 'No se pudo actualizar la subcategoría.'));
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
