import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/http/api-response.model';
import {
  CreateGerenteRequest,
  GerenteDropdownItem,
  GerenteResponse,
  UpdateGerenteRequest
} from '../models/gerente.models';
import { UsuarioResponse } from '../models/usuario.models';

@Injectable({
  providedIn: 'root'
})
export class GerentesService {
  private readonly http = inject(HttpClient);
  private readonly usuariosUrl = `${environment.apiUrl}/api/usuarios`;
  private readonly gerentesUrl = `${this.usuariosUrl}/gerentes`;

  getAll(): Observable<GerenteResponse[]> {
    return this.http
      .get<unknown>(this.gerentesUrl)
      .pipe(map((raw) => this.normalizeListResponse(raw)));
  }

  getUsuariosByRol(rol: string): Observable<UsuarioResponse[]> {
    const params = new HttpParams().set('rol', rol.trim().toUpperCase());

    return this.http
      .get<unknown>(this.usuariosUrl, { params })
      .pipe(map((raw) => this.normalizeUsuariosResponse(raw)));
  }

  getDropdown(): Observable<GerenteDropdownItem[]> {
    return this.http
      .get<unknown>(`${this.gerentesUrl}/dropdown`)
      .pipe(map((raw) => this.normalizeDropdownResponse(raw)));
  }

  getActiveGerenteOptions(): Observable<GerenteDropdownItem[]> {
    return this.getUsuariosByRol('GERENTE').pipe(
      map((usuarios) =>
        usuarios
          .filter((usuario) => usuario.estado)
          .map((usuario) => ({
            idUsuario: usuario.idUsuario,
            nombreCompleto: usuario.nombreCompleto,
            email: usuario.email,
            estado: usuario.estado
          }))
      )
    );
  }

  getById(id: number): Observable<GerenteResponse> {
    return this.http
      .get<unknown>(`${this.usuariosUrl}/${id}`)
      .pipe(map((raw) => this.normalizeItemResponse(raw)));
  }

  create(body: CreateGerenteRequest, adminToken?: string): Observable<ApiResponse<GerenteResponse | null>> {
    return this.http
      .post<unknown>(this.gerentesUrl, body, this.createRequestOptions(adminToken))
      .pipe(map((raw) => this.normalizeMutationResponse(raw)));
  }

  update(id: number, body: UpdateGerenteRequest, adminToken?: string): Observable<ApiResponse<GerenteResponse | null>> {
    return this.http
      .put<unknown>(`${this.gerentesUrl}/${id}`, body, this.createRequestOptions(adminToken))
      .pipe(map((raw) => this.normalizeMutationResponse(raw)));
  }

  updateEstado(id: number, activo: boolean, adminToken?: string): Observable<ApiResponse<GerenteResponse | null>> {
    const params = new HttpParams().set('activo', String(activo));

    return this.http
      .patch<unknown>(`${this.usuariosUrl}/${id}/estado`, {}, { ...this.createRequestOptions(adminToken), params })
      .pipe(map((raw) => this.normalizeMutationResponse(raw)));
  }

  remove(id: number, adminToken?: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<unknown>(`${this.usuariosUrl}/${id}`, this.createRequestOptions(adminToken))
      .pipe(map((raw) => this.normalizeEmptyMutationResponse(raw)));
  }

  private createRequestOptions(adminToken?: string): { headers?: HttpHeaders } {
    if (!adminToken || adminToken.trim().length === 0) {
      return {};
    }

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${adminToken}`
      })
    };
  }

  private normalizeListResponse(raw: unknown): GerenteResponse[] {
    const source = this.unwrapData(raw);
    if (!Array.isArray(source)) {
      return [];
    }

    return source.map((item) => this.toGerenteResponse(item));
  }

  private normalizeUsuariosResponse(raw: unknown): UsuarioResponse[] {
    const source = this.unwrapData(raw);
    if (!Array.isArray(source)) {
      return [];
    }

    return source.map((item) => this.toUsuarioResponse(item));
  }

  private normalizeDropdownResponse(raw: unknown): GerenteDropdownItem[] {
    const source = this.unwrapData(raw);
    if (!Array.isArray(source)) {
      return [];
    }

    return source.map((item) => this.toDropdownItem(item));
  }

  private normalizeItemResponse(raw: unknown): GerenteResponse {
    const source = this.unwrapData(raw);

    if (Array.isArray(source)) {
      return this.toGerenteResponse(source[0]);
    }

    return this.toGerenteResponse(source);
  }

  private normalizeMutationResponse(raw: unknown): ApiResponse<GerenteResponse | null> {
    const source = this.unwrapEnvelope(raw);
    const data = source['data'];
    const normalizedData = Array.isArray(data)
      ? this.toGerenteResponse(data[0])
      : data === null || data === undefined
        ? null
        : this.toGerenteResponse(data);

    return {
      timestamp: this.toString(source['timestamp']),
      message: this.toString(source['message']),
      data: normalizedData
    };
  }

  private normalizeEmptyMutationResponse(raw: unknown): ApiResponse<null> {
    const source = this.unwrapEnvelope(raw);

    return {
      timestamp: this.toString(source['timestamp']),
      message: this.toString(source['message']),
      data: null
    };
  }

  private unwrapEnvelope(raw: unknown): Record<string, unknown> {
    const source = this.toRecord(raw) ?? {};

    if ('data' in source) {
      return source as Record<string, unknown>;
    }

    return { data: source };
  }

  private unwrapData(raw: unknown): unknown {
    const source = this.toRecord(raw) ?? {};

    if ('data' in source) {
      return source['data'];
    }

    return raw;
  }

  private toGerenteResponse(raw: unknown): GerenteResponse {
    const usuario = this.toUsuarioResponse(raw);

    return {
      ...usuario
    };
  }

  private toUsuarioResponse(raw: unknown): UsuarioResponse {
    const source = this.toRecord(raw) ?? {};

    return {
      idUsuario: this.toNumber(source['idUsuario'] ?? source['id_usuario'] ?? source['id']),
      nombreCompleto: this.toString(source['nombreCompleto'] ?? source['nombre_completo'] ?? source['nombre']),
      email: this.toString(source['email'] ?? source['correo']),
      rol: this.toString(source['rol'] ?? source['role']),
      idSede: this.toNumberOrNull(source['idSede'] ?? source['id_sede']),
      estado: this.toBoolean(source['estado'] ?? source['activo']),
      fechaCreacion: this.toString(source['fechaCreacion'] ?? source['fecha_creacion'] ?? source['createdAt'])
    };
  }

  private toDropdownItem(raw: unknown): GerenteDropdownItem {
    const source = this.toRecord(raw) ?? {};

    return {
      idUsuario: this.toNumber(source['idUsuario'] ?? source['id_usuario'] ?? source['id']),
      nombreCompleto: this.toString(source['nombreCompleto'] ?? source['nombre_completo'] ?? source['nombre']),
      email: this.toOptionalString(source['email'] ?? source['correo']),
      estado: this.toOptionalBoolean(source['estado'] ?? source['activo'])
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

  private toOptionalString(value: unknown): string | undefined {
    const result = this.toString(value).trim();
    return result.length > 0 ? result : undefined;
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

  private toNumberOrNull(value: unknown): number | null {
    const parsed = this.toNumber(value);
    return parsed > 0 ? parsed : null;
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

  private toOptionalBoolean(value: unknown): boolean | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    return this.toBoolean(value);
  }
}
