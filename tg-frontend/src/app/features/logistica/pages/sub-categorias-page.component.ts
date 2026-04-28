import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { AdminApprovalModalComponent } from '../../../shared/components/admin-approval-modal/admin-approval-modal.component';
import { AppInputComponent } from '../../../shared/ui/app-input/app-input.component';
import { CategoriasService } from '../services/categorias.service';
import { CategoriasApiService } from '../services/categorias-api.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { SubCategoriaResponse } from '../models/subcategoria.models';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';

@Component({
  selector: 'app-sub-categorias-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppInputComponent, AdminApprovalModalComponent],
  templateUrl: './sub-categorias-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubCategoriasPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoriasService = inject(CategoriasService);
  private readonly categoriasApi = inject(CategoriasApiService);
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);

  protected readonly subcategorias = signal<SubCategoriaResponse[]>([]);
  protected readonly isAdmin = signal(this.tokenStorage.isAdmin());
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly approvalVisible = signal(false);
  protected readonly approvalLoading = signal(false);
  protected readonly approvalError = signal('');
  protected readonly deleteTarget = signal<SubCategoriaResponse | null>(null);
  protected readonly pendingAdminToken = signal<string | null>(null);

  protected readonly filterForm = this.fb.group({ nombre: [''] });

  constructor() {
    this.loadSubCategorias();
  }

  private loadSubCategorias(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.categoriasApi
      .listSubCategorias()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.subcategorias.set(data),
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error, 'No se pudo cargar las subcategorías.'))
      });
  }

  protected onDeleteClick(s: SubCategoriaResponse): void {
    this.deleteTarget.set(s);
    this.pendingAdminToken.set(null);
    this.approvalError.set('');
    this.approvalVisible.set(true);
  }

  protected onAdminApproved(credentials: { email: string; password: string }): void {
    const target = this.deleteTarget();
    if (!target) return;

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

        this.pendingAdminToken.set(token);
        this.categoriasApi.borrarSubCategoria(target.id, token).subscribe({
          next: () => {
            this.approvalVisible.set(false);
            this.approvalLoading.set(false);
            this.deleteTarget.set(null);
            this.loadSubCategorias();
          },
          error: (err: unknown) => {
            this.approvalLoading.set(false);
            const httpErr = err as HttpErrorResponse;
            if (httpErr?.status === 401 || httpErr?.status === 403) {
              this.approvalVisible.set(true);
              this.approvalError.set('Se requiere validación ADMIN.');
              return;
            }

            this.approvalVisible.set(false);
            this.approvalError.set(this.resolveError(err, 'No se pudo eliminar la subcategoría.'));
          }
        });
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
    this.deleteTarget.set(null);
  }

  private resolveError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? error.message ?? fallback;
    }

    return typeof error === 'string' ? error : fallback;
  }
}
