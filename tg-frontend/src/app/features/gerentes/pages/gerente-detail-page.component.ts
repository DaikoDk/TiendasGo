import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { readApiErrorMessage } from '../../../core/http/api-error.util';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { GerenteResponse } from '../models/gerente.models';
import { GerentesService } from '../services/gerentes.service';

@Component({
  selector: 'app-gerente-detail-page',
  imports: [RouterLink, AppCardComponent],
  templateUrl: './gerente-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GerenteDetailPageComponent {
  private readonly gerentesService = inject(GerentesService);
  private readonly route = inject(ActivatedRoute);

  protected readonly gerenteId = this.parseRouteId(this.route.snapshot.paramMap.get('id'));
  protected readonly gerente = signal<GerenteResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly statusLabel = computed(() => (this.gerente()?.estado ? 'Activo' : 'Inactivo'));

  constructor() {
    this.loadGerente();
  }

  protected formatFecha(value: string): string {
    if (!value) {
      return '--';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private loadGerente(): void {
    if (this.gerenteId === null) {
      this.errorMessage.set('El id del gerente no es valido.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.gerentesService
      .getById(this.gerenteId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          this.gerente.set(result);
        },
        error: (error: unknown) => {
          this.errorMessage.set(readApiErrorMessage(error, 'No se pudo cargar el detalle del gerente.'));
        }
      });
  }

  private parseRouteId(value: string | null): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }
}
