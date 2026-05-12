import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';

import { Producto, ProductoRequest } from '../models/producto.models';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.catalogApiUrl}/api/catalog/productos`;

  getAll(): Observable<Producto[]> {
    return this.http.get<unknown>(this.baseUrl).pipe(
      map((raw) => this.normalizeListResponse(raw))
    );
  }

  getById(id: number): Observable<Producto> {
    return this.http.get<unknown>(`${this.baseUrl}/${id}`).pipe(
      map((raw) => this.toProducto(this.unwrapData(raw)))
    );
  }

  create(data: ProductoRequest, token: string): Observable<Producto> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<Producto>(this.baseUrl, data, { headers });
  }

  update(id: number, data: ProductoRequest, token: string): Observable<Producto> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put<Producto>(`${this.baseUrl}/${id}`, data, { headers });
  }

  cambiarEstado(id: number, activo: boolean, token: string): Observable<void> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.patch<void>(`${this.baseUrl}/${id}/estado`, null, {
      headers,
      params: { activo }
    });
  }

  private normalizeListResponse(raw: unknown): Producto[] {
    const source = this.unwrapData(raw);
    if (!Array.isArray(source)) {
      return [];
    }
    return source.map((item) => this.toProducto(item));
  }

  private unwrapData(raw: unknown): unknown {
    if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
      return (raw as Record<string, unknown>)['data'];
    }
    return raw;
  }

  private toProducto(raw: unknown): Producto {
    const src = (raw ?? {}) as Record<string, unknown>;
    return {
      id: this.toNumberOrNull(src['id']),
      nombreBase: this.toString(src['nombreBase'] ?? src['nombre_base']),
      variante: this.toNullableString(this.toString(src['variante'])),
      medidaValor: this.toNullableString(this.toString(src['medidaValor'] ?? src['medida_valor'])),
      medidaUnidad: this.toNullableString(this.toString(src['medidaUnidad'] ?? src['medida_unidad'])),
      sku: this.toNullableString(this.toString(src['sku'])),
      precioCosto: this.toNumberOrNull(src['precioCosto'] ?? src['precio_costo']),
      precioVenta: this.toNumberOrNull(src['precioVenta'] ?? src['precio_venta']),
      imagenUrl: this.toNullableString(this.toString(src['imagenUrl'] ?? src['imagen_url'])),
      estado: this.toBoolean(src['estado']),
      nombreMarca: this.toNullableString(this.toString(src['nombreMarca'])),
      nombreSubCategoria: this.toNullableString(this.toString(src['nombreSubCategoria'])),
      idMarca: this.toNumberOrNull(src['idMarca'] ?? src['id_marca']),
      idSubCategoria: this.toNumberOrNull(src['idSubCategoria'] ?? src['id_subcategoria'])
    };
  }

  private toString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private toNullableString(value: string | null | undefined): string | null {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : null;
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const n = value.trim().toLowerCase();
      if (n === 'true' || n === '1' || n === 'activo') return true;
      if (n === 'false' || n === '0' || n === 'inactivo') return false;
    }
    return false;
  }
}
