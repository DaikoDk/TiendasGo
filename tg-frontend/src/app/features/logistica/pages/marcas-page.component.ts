import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AdminApprovalModalComponent } from '../../../shared/components/admin-approval-modal/admin-approval-modal.component';
import { AppInputComponent } from '../../../shared/ui/app-input/app-input.component';
import { AuthService } from '../../../core/auth/services/auth.service';
import { MarcasService } from '../services/marcas.service';
import { MarcaResponse } from '../models/marca.models';

@Component({
  selector: 'app-marcas-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppInputComponent, AdminApprovalModalComponent],
  templateUrl: './marcas-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarcasPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly marcasService = inject(MarcasService);

  protected readonly marcas = signal<MarcaResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly approvalVisible = signal(false);
  protected readonly approvalLoading = signal(false);
  protected readonly approvalError = signal('');
  protected readonly deleteTarget = signal<MarcaResponse | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = 10;

  protected readonly filterForm = this.fb.group({
    nombre: [''],
    codigo: ['']
  });

  protected readonly filteredMarcas = computed(() => {
    const nombre = (this.filterForm.controls.nombre.value ?? '').toString().trim().toLowerCase();
    const codigo = (this.filterForm.controls.codigo.value ?? '').toString().trim().toLowerCase();

    return this.marcas().filter((marca) => {
      const nombreMarca = (marca.nombre ?? '').toString().toLowerCase();
      const codigoMarca = (marca.codigoMarca ?? '').toString().toLowerCase();
      return nombreMarca.includes(nombre) && codigoMarca.includes(codigo);
    });
  });

  protected readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredMarcas().length / this.pageSize));
  });

  protected readonly pageList = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, index) => index + 1);
  });

  protected readonly pagedMarcas = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredMarcas().slice(start, start + this.pageSize);
  });

  constructor() {
    this.loadMarcas();
    this.filterForm.valueChanges.subscribe(() => this.page.set(1));
  }

  private loadMarcas(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.marcasService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.marcas.set(data),
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error, 'No se pudo cargar las marcas.'))
      });
  }

  protected onResetFilters(): void {
    this.filterForm.reset({ nombre: '', codigo: '' });
    this.page.set(1);
  }

  protected previousPage(): void {
    if (this.page() > 1) {
      this.page.update((current) => current - 1);
    }
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((current) => current + 1);
    }
  }

  protected goToPage(pageNumber: number): void {
    this.page.set(pageNumber);
  }

  protected onDeleteClick(marca: MarcaResponse): void {
    this.deleteTarget.set(marca);
    this.approvalError.set('');
    this.approvalVisible.set(true);
  }

  protected onAdminApproved(credentials: { email: string; password: string }): void {
    const target = this.deleteTarget();
    if (!target) {
      return;
    }

    this.approvalLoading.set(true);
    this.approvalError.set('');

    this.authService.validateAdminCredentials(credentials).subscribe({
      next: () => this.deleteMarca(target),
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
    this.deleteTarget.set(null);
  }

  private deleteMarca(marca: MarcaResponse): void {
    this.marcasService.delete(marca.id).subscribe({
      next: () => {
        this.approvalVisible.set(false);
        this.approvalLoading.set(false);
        this.deleteTarget.set(null);
        this.loadMarcas();
      },
      error: (error: unknown) => {
        this.approvalLoading.set(false);
        this.approvalError.set(this.resolveError(error, 'No se pudo eliminar la marca.'));
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
