import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize, forkJoin } from 'rxjs';

import { AdminApprovalModalComponent } from '../../../../shared/components/admin-approval-modal/admin-approval-modal.component';
import { AppInputComponent } from '../../../../shared/ui/app-input/app-input.component';
import { AppCardComponent } from '../../../../shared/ui/app-card/app-card.component';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ProductoService } from '../services/producto.service';
import { MarcasApiService } from '../../marcas/services/marcas.service';
import { ProductoRequest } from '../models/producto.models';
import { MarcaResponse } from '../../marcas/models/marca.models';
import { SubCategoriaResponse } from '../../subcategorias/models/subcategoria.models';

import { CategoriasApiService } from '../../categorias/services/categorias.service';

@Component({
  selector: 'app-producto-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppInputComponent, AppCardComponent, AdminApprovalModalComponent],
  templateUrl: './producto-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductoFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);
  private readonly categoriasService = inject(CategoriasApiService);
  
  private readonly marcasService = inject(MarcasApiService);
  private readonly authService = inject(AuthService);

  private readonly routeId = this.parseId(this.route.snapshot.paramMap.get('id'));
  protected readonly isEditMode = signal(this.routeId !== null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly approvalVisible = signal(false);
  protected readonly approvalLoading = signal(false);
  protected readonly approvalError = signal('');
  protected readonly pendingPayload = signal<ProductoRequest | null>(null);

  protected readonly pageTitle = computed(() => (this.isEditMode() ? 'Editar Producto' : 'Nuevo Producto'));
  protected readonly submitLabel = computed(() => (this.isEditMode() ? 'Actualizar' : 'Crear'));

  protected readonly subcategorias = signal<SubCategoriaResponse[]>([]);
  protected readonly marcas = signal<MarcaResponse[]>([]);
  protected readonly loadingData = signal(false);
  protected readonly dataError = signal('');

  protected readonly form = this.fb.group({
    idSubcategoria: [null as number | null, [Validators.required]],
    idMarca: [null as number | null, [Validators.required]],
    nombreBase: ['', [Validators.required, Validators.maxLength(100)]],
    sku: [{ value: '', disabled: true }],
    variante: ['', [Validators.maxLength(50)]],
    medidaValor: ['', [Validators.maxLength(10)]],
    medidaUnidad: ['', [Validators.maxLength(5)]],
    precioCosto: [null as number | null, [Validators.required, Validators.min(0.01)]],
    precioVenta: [null as number | null, [Validators.required, Validators.min(0.01)]],
    imagenUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    estado: [true]
  }, { validators: [this.priceValidator()] });

  ngOnInit(): void {
    this.loadDependencies();
    if (this.routeId !== null) {
      this.loadProducto(this.routeId);
    }
  }

  private parseId(value: string | null): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private loadDependencies(): void {
    this.loadingData.set(true);
    this.dataError.set('');

    forkJoin({
      subcategorias: this.categoriasService.listSubCategorias(),
      marcas: this.marcasService.listAll()
    }).pipe(
    finalize(() => this.loadingData.set(false))
  ).subscribe({
    next: (result) => {
      this.subcategorias.set(result.subcategorias.filter(s => s.estado));
      this.marcas.set(result.marcas.filter(m => m.activo ?? true));
    },
    error: () => {
      this.dataError.set('No se pudieron cargar las marcas o subcategorías.');
    }
  });
}

 private loadProducto(id: number): void {
        this.loading.set(true);
        this.error.set('');

    this.productoService.getById(id).pipe(
            finalize(() => this.loading.set(false))
        ).subscribe({
            next: (prod) => {
            this.form.patchValue({

                idSubcategoria: prod.idSubCategoria,
                sku: prod.sku,
                idMarca: prod.idMarca,
                nombreBase: prod.nombreBase,
                variante: prod.variante ?? '',
                medidaValor: prod.medidaValor?.toString() ?? '',
                medidaUnidad: prod.medidaUnidad ?? '',
                precioCosto: prod.precioCosto,
                precioVenta: prod.precioVenta,
                imagenUrl: prod.imagenUrl,
                estado: prod.estado ?? true
            });
        },
        error: (err: unknown) => this.error.set(this.resolveError(err, 'No se pudo cargar el producto.'))
    });
    }

  protected onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: ProductoRequest = {
      idSubCategoria: Number(raw.idSubcategoria),
      idMarca: Number(raw.idMarca),
      nombreBase: (raw.nombreBase ?? '').trim(),
      precioCosto: Number(raw.precioCosto),
      precioVenta: Number(raw.precioVenta),
      sku: raw.sku,
      variante: raw.variante?.trim() || null,
      medidaValor: raw.medidaValor?.trim() || null,
      medidaUnidad: raw.medidaUnidad?.trim() || null,
      imagenUrl: raw.imagenUrl?.trim() || null,
      estado: raw.estado ?? true
    };

    this.pendingPayload.set(payload);
    this.approvalError.set('');
    this.approvalVisible.set(true);
  }

  protected onCancel(): void {
    void this.router.navigate(['/dashboard/logistica/productos']);
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

        if (this.isEditMode() && this.routeId !== null) {
          this.updateProducto(this.routeId, payload, token);
        } else {
          this.createProducto(payload, token);
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

  private createProducto(payload: ProductoRequest, token: string): void {
    this.saving.set(true);
    this.productoService.create(payload, token).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.approvalVisible.set(false);
        this.approvalLoading.set(false);
        void this.router.navigate(['/dashboard/logistica/productos']);
      },
      error: (err: unknown) => this.handleApiError(err, 'No se pudo crear el producto.')
    });
  }

  private updateProducto(id: number, payload: ProductoRequest, token: string): void {
    this.saving.set(true);
    this.productoService.update(id, payload, token).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.approvalVisible.set(false);
        this.approvalLoading.set(false);
        void this.router.navigate(['/dashboard/logistica/productos']);
      },
      error: (err: unknown) => this.handleApiError(err, 'No se pudo actualizar el producto.')
    });
  }

  private handleApiError(err: unknown, fallback: string): void {
    this.approvalLoading.set(false);
    const httpErr = err as HttpErrorResponse;
    if (httpErr?.status === 401 || httpErr?.status === 403) {
      this.approvalVisible.set(true);
      this.approvalError.set('Se requiere validación ADMIN.');
      return;
    }
    this.approvalVisible.set(false);
    this.error.set(this.resolveError(err, fallback));
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpolyline points="21 15 16 10 5 21"/%3E%3C/svg%3E';
    img.classList.add('opacity-50');
  }

  private resolveError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 400) return 'Verifica los campos del formulario.';
      if (error.status === 409) return 'El SKU ya existe, intenta con otra combinación.';
      return error.error?.message ?? error.message ?? fallback;
    }
    return typeof error === 'string' ? error : fallback;
  }

  private priceValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const costo = Number(group.get('precioCosto')?.value);
      const venta = Number(group.get('precioVenta')?.value);
      if (!isNaN(costo) && !isNaN(venta) && venta <= costo) {
        return { priceWarning: true };
      }
      return null;
    };
  }

  protected showPriceWarning(): boolean {
    const costoTouched = this.form.get('precioCosto')?.touched;
    const ventaTouched = this.form.get('precioVenta')?.touched;
    return Boolean(this.form.hasError('priceWarning') && (costoTouched || ventaTouched));
  }
}