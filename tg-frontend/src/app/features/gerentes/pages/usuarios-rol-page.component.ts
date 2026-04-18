import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { UsuarioResponse } from '../models/usuario.models';
import { GerentesService } from '../services/gerentes.service';

@Component({
  selector: 'app-usuarios-rol-page',
  imports: [RouterLink, AppCardComponent],
  templateUrl: './usuarios-rol-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuariosRolPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly gerentesService = inject(GerentesService);

  protected readonly usuarios = signal<UsuarioResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly selectedRol = signal('');

  constructor() {
    const rol = this.route.snapshot.paramMap.get('rol')?.trim() ?? '';
    this.selectedRol.set(rol.toUpperCase());
    this.loadUsuariosByRol(rol);
  }

  protected canCreateGerente(): boolean {
    return this.selectedRol() === 'GERENTE';
  }

  protected formatEstado(value: boolean): string {
    return value ? 'Activo' : 'Inactivo';
  }

  protected formatSede(value: number | null): string {
    return value && value > 0 ? `Sede #${value}` : 'Sin sede';
  }

  protected formatFecha(value: string): string {
    if (!value) {
      return '--';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  }

  private loadUsuariosByRol(rol: string): void {
    const normalizedRole = rol.trim();
    if (normalizedRole.length === 0) {
      this.errorMessage.set('No se pudo cargar la informacion');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.gerentesService
      .getUsuariosByRol(normalizedRole)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (usuarios) => {
          const expectedRole = this.selectedRol().trim().toUpperCase();
          this.usuarios.set(
            usuarios.filter((usuario) => usuario.rol.trim().toUpperCase() === expectedRole)
          );
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveLoadError(error));
        }
      });
  }

  private resolveLoadError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Sesion expirada';
      }

      if (error.status === 403) {
        return 'No autorizado';
      }
    }

    return 'No se pudo cargar la informacion';
  }
}