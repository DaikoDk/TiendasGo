import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { SedeGerenteInfo, SedeRequest, SedeResponse } from '../models/sede.models';

@Injectable({
  providedIn: 'root'
})
export class SedesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/sedes`;

  getAll(): Observable<SedeResponse[]> {
    return this.http
      .get<unknown>(this.url)
      .pipe(map((raw) => this.normalizeListResponse(raw)));
  }

  getById(id: number): Observable<SedeResponse> {
    return this.http
      .get<unknown>(`${this.url}/${id}`)
      .pipe(map((raw) => this.normalizeItemResponse(raw)));
  }

  create(payload: SedeRequest, adminToken?: string): Observable<SedeResponse> {
    const options = this.createRequestOptions(adminToken);

    return this.http
      .post<unknown>(this.url, this.toApiPayload(payload), options)
      .pipe(map((raw) => this.normalizeItemResponse(raw)));
  }

  update(id: number, payload: SedeRequest, adminToken?: string): Observable<SedeResponse> {
    const options = this.createRequestOptions(adminToken);

    return this.http
      .put<unknown>(`${this.url}/${id}`, this.toApiPayload(payload), options)
      .pipe(map((raw) => this.normalizeItemResponse(raw)));
  }

  delete(id: number, adminToken?: string): Observable<void> {
    const options = this.createRequestOptions(adminToken);
    return this.http.delete<void>(`${this.url}/${id}`, options);
  }

  private createRequestOptions(token?: string): { headers?: HttpHeaders } {
    if (!token || token.trim().length === 0) {
      return {};
    }

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  private normalizeListResponse(raw: unknown): SedeResponse[] {
    const source = this.unwrapData(raw);
    if (!Array.isArray(source)) {
      return [];
    }

    return source.map((item) => this.toSedeResponse(item));
  }

  private normalizeItemResponse(raw: unknown): SedeResponse {
    const source = this.unwrapData(raw);

    if (Array.isArray(source)) {
      return this.toSedeResponse(source[0]);
    }

    return this.toSedeResponse(source);
  }

  private unwrapData(raw: unknown): unknown {
    if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
      return (raw as Record<string, unknown>)['data'];
    }

    return raw;
  }

  private toSedeResponse(raw: unknown): SedeResponse {
    const source = (raw ?? {}) as Record<string, unknown>;
    const gerente = this.toSedeGerenteInfo(
      source['gerente'] ?? source['gerenteUsuario'] ?? source['usuarioGerente']
    );
    const gerenteNombreLegacy = this.toNullableString(
      this.toString(source['gerenteNombre'] ?? source['gerente_nombre'])
    );
    const gerenteEmailLegacy = this.toNullableString(
      this.toString(source['gerenteEmail'] ?? source['gerente_email'])
    );
    const gerenteId = this.toNumberOrNull(
      source['idGerente'] ?? source['id_gerente'] ?? gerente?.idUsuario
    );

    return {
      idSede: this.toNumber(source['idSede'] ?? source['id_sede'] ?? source['id']),
      nombre: this.toString(source['nombre'] ?? source['nombre_sede']),
      email: this.toNullableString(this.toString(source['email'])),
      gerenteNombre: gerente?.nombreCompleto ?? gerenteNombreLegacy,
      gerenteEmail: gerente?.email ?? gerenteEmailLegacy,
      direccion: this.toNullableString(this.toString(source['direccion'])),
      ubigeo: this.toNullableString(this.toString(source['ubigeo'])),
      telefono: this.toNullableString(this.toString(source['telefono'] ?? source['telefono_sede'])),
      esAlmacenCentral: this.toBoolean(
        source['esAlmacenCentral'] ?? source['es_almacen_central']
      ),
      estado: this.toBoolean(source['estado']),
      horarioConfig: this.toHorarioConfigValue(source['horarioConfig'] ?? source['horario_config']),
      idGerente: gerenteId,
      gerente
    };
  }

  private toApiPayload(payload: SedeRequest): Record<string, unknown> {
    return {
      nombre: payload.nombre,
      direccion: this.toNullableString(payload.direccion),
      ubigeo: this.toNullableString(payload.ubigeo),
      telefono: this.toNullableString(payload.telefono),
      esAlmacenCentral: payload.esAlmacenCentral,
      estado: payload.estado,
      horarioConfig: payload.horarioConfig,
      idGerente: payload.idGerente ?? null
    };
  }

  private toSedeGerenteInfo(value: unknown): SedeGerenteInfo | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const source = value as Record<string, unknown>;
    const idUsuario = this.toNumber(source['idUsuario'] ?? source['id_usuario'] ?? source['id']);
    if (idUsuario <= 0) {
      return null;
    }

    return {
      idUsuario,
      nombreCompleto: this.toString(
        source['nombreCompleto'] ?? source['nombre_completo'] ?? source['nombre']
      ),
      email: this.toNullableString(this.toString(source['email'] ?? source['correo'])),
      estado: this.toBoolean(source['estado'] ?? source['activo'])
    };
  }

  private toHorarioConfigValue(value: unknown): Record<string, unknown> | string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized.length > 0 ? value : null;
    }

    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }

    return null;
  }

  private toString(value: unknown): string {
    return typeof value === 'string' ? value : '';
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

  private toNullableString(value: string | null | undefined): string | null {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : null;
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return null;
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
      if (normalized === 'true' || normalized === '1' || normalized === 'activo') {
        return true;
      }

      if (normalized === 'false' || normalized === '0' || normalized === 'inactivo') {
        return false;
      }
    }

    return false;
  }
}
