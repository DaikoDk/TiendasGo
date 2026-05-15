import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoriaRequest, CategoriaResponse } from '../models/categoria.models';
import { SubCategoriaRequest, SubCategoriaResponse } from '../../subcategorias/models/subcategoria.models';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoriasApiService {
  private readonly http = inject(HttpClient);
  private readonly baseCategorias = `${environment.catalogApiUrl}/api/catalog/categorias`;
  private readonly baseSubCategorias = `${environment.catalogApiUrl}/api/catalog/sub-categorias`;

  listCategorias(): Observable<CategoriaResponse[]> {
    return this.http
      .get<{ timestamp?: string; message?: string; data: CategoriaResponse[] }>(this.baseCategorias)
      .pipe(map((r) => (r && 'data' in r ? (r.data as CategoriaResponse[]) : ([] as CategoriaResponse[]))));
  }

  getCategoria(id: number): Observable<CategoriaResponse> {
    return this.http
      .get<{ timestamp?: string; message?: string; data: CategoriaResponse }>(`${this.baseCategorias}/${id}`)
      .pipe(map((r) => (r && 'data' in r ? (r.data as CategoriaResponse) : ({} as CategoriaResponse))));
  }

  crearCategoria(data: CategoriaRequest, token: string): Observable<CategoriaResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
    const payload: Record<string, unknown> = { nombre: data.nombre };
    return this.http.post<CategoriaResponse>(this.baseCategorias, payload, { headers });
  }

  actualizarCategoria(id: number, data: CategoriaRequest, token: string): Observable<CategoriaResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
    const payload: Record<string, unknown> = { nombre: data.nombre };
    return this.http.put<CategoriaResponse>(`${this.baseCategorias}/${id}`, payload, { headers });
  }

  borrarCategoria(id: number, token: string, force = false): Observable<void> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${this.baseCategorias}/${id}${force ? '?force=true' : ''}`;
    return this.http.delete<void>(url, { headers });
  }

  listSubCategorias(): Observable<SubCategoriaResponse[]> {
    return this.http
      .get<{ timestamp?: string; message?: string; data: unknown[] }>(this.baseSubCategorias)
      .pipe(
        map((r) =>
          r && 'data' in r
            ? (r.data as unknown[]).map((item) => this.normalizeSubCategoria(item))
            : ([] as SubCategoriaResponse[])
        )
      );
  }

  getSubCategoria(id: number): Observable<SubCategoriaResponse> {
    return this.http
      .get<{ timestamp?: string; message?: string; data: unknown }>(`${this.baseSubCategorias}/${id}`)
      .pipe(map((r) => (r && 'data' in r ? this.normalizeSubCategoria(r.data) : ({} as SubCategoriaResponse))));
  }

  crearSubCategoria(data: SubCategoriaRequest, token: string): Observable<SubCategoriaResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
    const payload: Record<string, unknown> = { nombre: data.nombre, idCategoria: data.idCategoria };
    return this.http.post<SubCategoriaResponse>(this.baseSubCategorias, payload, { headers });
  }

  actualizarSubCategoria(id: number, data: SubCategoriaRequest, token: string): Observable<SubCategoriaResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
    const payload: Record<string, unknown> = { nombre: data.nombre, idCategoria: data.idCategoria };
    return this.http.put<SubCategoriaResponse>(`${this.baseSubCategorias}/${id}`, payload, { headers });
  }

  borrarSubCategoria(id: number, token: string): Observable<void> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete<void>(`${this.baseSubCategorias}/${id}`, { headers });
  }

  private normalizeSubCategoria(raw: unknown): SubCategoriaResponse {
    const src = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
    const id = typeof src['id'] === 'number' ? src['id'] as number : Number(src['id'] ?? 0);
    const nombre = typeof src['nombre'] === 'string' ? (src['nombre'] as string) : String(src['nombre'] ?? '');
    const idCategoria = typeof src['categoriaId'] === 'number' ? (src['categoriaId'] as number) : Number(src['idCategoria'] ?? src['categoriaId'] ?? 0);
    const nombreCategoriaPadre = typeof src['nombreCategoriaPadre'] === 'string' ? (src['nombreCategoriaPadre'] as string) : String(src['nombreCategoriaPadre'] ?? src['nombreCategoria'] ?? '');
    const prefijo = src['prefijo'] == null ? null : String(src['prefijo']);
    const estado = typeof src['activo'] === 'boolean' ? (src['activo'] as boolean) : Boolean(src['estado'] ?? src['activo']);

    return {
      id: Number.isFinite(Number(id)) ? id : 0,
      nombre: nombre ?? '',
      idCategoria: Number.isFinite(Number(idCategoria)) ? Number(idCategoria) : 0,
      nombreCategoriaPadre: nombreCategoriaPadre ?? undefined,
      prefijo: prefijo ?? null,
      estado: Boolean(estado)
    } as SubCategoriaResponse;
  }
}
