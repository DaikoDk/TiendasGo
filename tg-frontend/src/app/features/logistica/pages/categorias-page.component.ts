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
import { CategoriaResponse } from '../models/categoria.models';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';

@Component({
  selector: 'app-categorias-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppInputComponent, AdminApprovalModalComponent],
  templateUrl: './categorias-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriasPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoriasService = inject(CategoriasService);
  private readonly categoriasApi = inject(CategoriasApiService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly authService = inject(AuthService);


  protected readonly categorias = signal<CategoriaResponse[]>([]);
  protected readonly isAdmin = signal(this.tokenStorage.isAdmin());
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly approvalVisible = signal(false);
  protected readonly approvalLoading = signal(false);
  protected readonly approvalError = signal('');
  protected readonly deleteTarget = signal<CategoriaResponse | null>(null);
  protected readonly pendingAdminToken = signal<string | null>(null);
  protected readonly pendingForceConfirm = signal(false);
  protected readonly cascadeCount = signal<number>(0);

  protected readonly filterForm = this.fb.group({ nombre: [''], prefijo: [''] });

  constructor() {
    this.loadCategorias();
  }

  private loadCategorias(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.categoriasService
      .getAllCategorias()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.categorias.set(data),
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error, 'No se pudo cargar las categorías.'))
      });
  }

  protected onResetFilters(): void {
    this.filterForm.reset({ nombre: '', prefijo: '' });
  }

  protected onDeleteClick(cat: CategoriaResponse): void {
    this.deleteTarget.set(cat);
    this.pendingForceConfirm.set(false);
    this.pendingAdminToken.set(null);
    this.cascadeCount.set(0);
    this.approvalError.set('');
    this.approvalVisible.set(true);
  }

  protected onAdminApproved(credentials: { email: string; password: string }): void {
    const target = this.deleteTarget();
    if (!target) return;

    this.approvalLoading.set(true);
    this.approvalError.set('');

    // validate admin and obtain token
    this.authService.validateAdminCredentials(credentials).subscribe({
      next: (session) => {
        const token = session.token;
        if (!token) {
          this.approvalLoading.set(false);
          this.approvalError.set('Respuesta de autenticación sin token.');
          return;
        }

        this.pendingAdminToken.set(token);
        // try delete without force first
        this.categoriasApi.borrarCategoria(target.id, token, false).subscribe({
          next: () => {
            this.approvalVisible.set(false);
            this.approvalLoading.set(false);
            this.deleteTarget.set(null);
            this.loadCategorias();
          },
          error: (err: unknown) => {
            this.approvalLoading.set(false);

            const httpErr = err as HttpErrorResponse;
            if (httpErr?.status === 409 && httpErr.error && httpErr.error.needsConfirmation) {
              const count = Number(httpErr.error.countSubcategoriasActivas ?? 0);
              this.cascadeCount.set(count);
              this.pendingForceConfirm.set(true);
              // keep modal closed and show inline confirm
              this.approvalVisible.set(false);
              return;
            }

            if (httpErr?.status === 401 || httpErr?.status === 403) {
              this.approvalVisible.set(true);
              this.approvalError.set('Se requiere validación ADMIN.');
              return;
            }

            this.approvalVisible.set(false);
            this.approvalError.set(this.resolveError(err, 'No se pudo inactivar la categoría.'));
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

  protected confirmCascade(): void {
    const target = this.deleteTarget();
    const token = this.pendingAdminToken();
    if (!target) return;

    if (token) {
      this.approvalLoading.set(true);
      this.categoriasApi.borrarCategoria(target.id, token, true).subscribe({
        next: () => {
          this.approvalLoading.set(false);
          this.pendingForceConfirm.set(false);
          this.deleteTarget.set(null);
          this.pendingAdminToken.set(null);
          this.loadCategorias();
        },
        error: (err: unknown) => {
          this.approvalLoading.set(false);
          if ((err as HttpErrorResponse)?.status === 401 || (err as HttpErrorResponse)?.status === 403) {
            // token invalid -> ask for admin again
            this.pendingAdminToken.set(null);
            this.approvalVisible.set(true);
            this.approvalError.set('Se requiere validación ADMIN.');
            return;
          }

          this.approvalError.set(this.resolveError(err, 'No se pudo confirmar la inactivación en cascada.'));
        }
      });
      return;
    }

    // No token present - request admin credentials again
    this.approvalError.set('Por favor revalida credenciales ADMIN para confirmar.');
    this.approvalVisible.set(true);
  }

  protected cancelCascade(): void {
    this.pendingForceConfirm.set(false);
    this.pendingAdminToken.set(null);
    this.deleteTarget.set(null);
  }

  private resolveError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? error.message ?? fallback;
    }

    return typeof error === 'string' ? error : fallback;
  }
}
