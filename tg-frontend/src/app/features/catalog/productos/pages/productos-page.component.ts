import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminApprovalModalComponent } from '../../../../shared/components/admin-approval-modal/admin-approval-modal.component';
import { AppCardComponent } from '../../../../shared/ui/app-card/app-card.component';
import { Producto } from '../models/producto.models';
import { ProductoService } from '../services/producto.service';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/auth/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-productos-page',
  standalone: true,
  imports: [AppCardComponent, RouterLink, AdminApprovalModalComponent, CommonModule], 
  templateUrl: './productos-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductosPageComponent implements OnInit {
  private readonly productoService = inject(ProductoService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly approvalVisible = signal(false);
  protected readonly approvalLoading = signal(false);
  protected readonly approvalError = signal('');

  private readonly authService = inject(AuthService);

  private productToDelete = signal<Producto | null>(null);

protected onAdminApproved(credentials: { email: string; password: string }): void {
    const target = this.productToDelete();
    if (!target) return;

    this.approvalLoading.set(true);
    this.approvalError.set('');

    // Validamos con el AuthService igual que en Marcas
    this.authService.validateAdminCredentials(credentials).subscribe({
      next: (session: any) => {
        const token = session?.token ?? '';
        this.deleteProducto(target, token);
      },
      error: (error: unknown) => {
        this.approvalLoading.set(false);
        this.approvalError.set(this.resolveError(error));
      }
    });
  }

  protected onAdminCancelled(): void {
    this.approvalVisible.set(false);
    this.approvalLoading.set(false);
    this.approvalError.set('');
    this.productToDelete.set(null);
  }

  protected onDeleteClick(producto: Producto): void {
    this.productToDelete.set(producto);
    this.approvalError.set('');
    this.approvalVisible.set(true);
  }

  

  ngOnInit(): void {
    this.loadProductos();
  }

  protected formatEstado(value: boolean): string {
    return value ? 'Activo' : 'Inactivo';
  }

  private loadProductos(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.productoService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.productos.set(data),
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error))
      });
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Tu sesion expiro. Inicia sesion nuevamente.';
      }

      if (error.status === 403) {
        return 'No tienes permisos suficientes para esta operacion.';
      }
    }

    return 'No se pudo cargar el listado de productos.';
  }


  private deleteProducto(producto: Producto, token: string): void {
    this.approvalLoading.set(true);
    this.productoService.cambiarEstado(producto.id!, false, token).subscribe({
      next: () => {
        this.approvalVisible.set(false);
        this.approvalLoading.set(false);
        this.productToDelete.set(null);
        this.loadProductos();
      },
      error: (error: unknown) => {
        this.approvalLoading.set(false);
        this.approvalError.set(this.resolveError(error));
      }
    });
  }

}
