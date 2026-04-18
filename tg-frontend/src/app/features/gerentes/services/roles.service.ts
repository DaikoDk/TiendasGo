import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/http/api-response.model';
import { RolResponse } from '../models/usuario.models';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/roles`;

  getRoles(): Observable<RolResponse[]> {
    return this.http
      .get<ApiResponse<unknown> | unknown>(this.url)
      .pipe(map((raw) => this.normalizeRoles(raw)));
  }

  private normalizeRoles(raw: ApiResponse<unknown> | unknown): RolResponse[] {
    const source = this.unwrapData(raw);
    if (!Array.isArray(source)) {
      return [];
    }

    return source.map((item) => this.toRolResponse(item)).filter((rol) => rol.estado);
  }

  private unwrapData(raw: ApiResponse<unknown> | unknown): unknown {
    if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
      return (raw as Record<string, unknown>)['data'];
    }

    return raw;
  }

  private toRolResponse(raw: unknown): RolResponse {
    const source = this.toRecord(raw) ?? {};

    return {
      idRol: this.toNumber(source['idRol'] ?? source['id_rol'] ?? source['id']),
      nombre: this.toString(source['nombre'] ?? source['name'] ?? source['rol']),
      descripcion: this.toNullableString(source['descripcion'] ?? source['description']),
      estado: this.toBoolean(source['estado'] ?? source['activo'])
    };
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private toString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private toNullableString(value: unknown): string | null {
    const result = this.toString(value).trim();
    return result.length > 0 ? result : null;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'activo';
    }

    return false;
  }
}