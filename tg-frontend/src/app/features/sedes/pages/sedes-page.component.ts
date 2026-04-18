import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { SedeResponse } from '../models/sede.models';
import { SedesService } from '../services/sedes.service';

@Component({
  selector: 'app-sedes-page',
  imports: [RouterLink, AppCardComponent],
  templateUrl: './sedes-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SedesPageComponent {
  private readonly sedesService = inject(SedesService);

  protected readonly sedes = signal<SedeResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  constructor() {
    this.loadSedes();
  }

  protected formatEstado(value: boolean): string {
    return value ? 'Activo' : 'Inactivo';
  }

  protected formatAlmacenCentral(value: boolean): string {
    return value ? 'Si' : 'No';
  }

  protected displayEmpty(value: string | null): string {
    return value && value.trim().length > 0 ? value : '';
  }

  protected displaySedeEmail(sede: SedeResponse): string {
    const email = sede.email?.trim() ?? '';
    if (email.length > 0) {
      return email;
    }

    const slug = (sede.nombre ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    return slug.length > 0 ? `sede.${slug}@tiendasgo.com` : '';
  }

  protected displayGerenteNombre(sede: SedeResponse): string {
    const fromGerente = sede.gerente?.nombreCompleto?.trim() ?? '';
    if (fromGerente.length > 0) {
      return fromGerente;
    }

    const legacy = sede.gerenteNombre?.trim() ?? '';
    return legacy.length > 0 ? legacy : 'Sin gerente';
  }

  protected displayGerenteEmail(sede: SedeResponse): string {
    const fromGerente = sede.gerente?.email?.trim() ?? '';
    if (fromGerente.length > 0) {
      return fromGerente;
    }

    const legacy = sede.gerenteEmail?.trim() ?? '';
    return legacy.length > 0 ? legacy : 'Sin gerente';
  }

  private loadSedes(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.sedesService
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.sedes.set(data);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error));
        }
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

    return 'No se pudo cargar el listado de sedes.';
  }
}
