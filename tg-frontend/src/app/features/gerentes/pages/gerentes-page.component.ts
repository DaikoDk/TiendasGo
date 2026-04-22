import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { RolResponse } from '../models/usuario.models';
import { RolesService } from '../services/roles.service';

@Component({
  selector: 'app-gerentes-page',
  imports: [AppCardComponent],
  templateUrl: './gerentes-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GerentesPageComponent {
  private readonly rolesService = inject(RolesService);
  private readonly router = inject(Router);

  protected readonly roles = signal<RolResponse[]>([]);
  protected readonly loadingRoles = signal(false);
  protected readonly errorMessage = signal('');

  constructor() {
    this.loadRoles();
  }

  protected selectRol(rol: RolResponse): void {
    void this.router.navigate(['/dashboard/administracion/usuarios', rol.nombre.toLowerCase()]);
  }

  private loadRoles(): void {
    this.loadingRoles.set(true);
    this.errorMessage.set('');

    this.rolesService
      .getRoles()
      .pipe(finalize(() => this.loadingRoles.set(false)))
      .subscribe({
        next: (roles) => {
          this.roles.set(roles);
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
