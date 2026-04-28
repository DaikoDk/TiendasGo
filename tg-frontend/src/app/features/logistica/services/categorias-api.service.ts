import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoriaRequest, CategoriaResponse } from '../models/categoria.models';
import { SubCategoriaRequest, SubCategoriaResponse } from '../models/subcategoria.models';

interface AuthResponse {
  token: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class CategoriasApiService {
  private readonly http = inject(HttpClient);

  // Auth
  authLogin(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('http://localhost:8080/api/auth/login', { email, password });
  }

  // Categorías
  listCategorias(): Observable<CategoriaResponse[]> {
    return this.http
      .get<{ timestamp?: string; message?: string; data: CategoriaResponse[] }>('http://localhost:8081/api/catalog/categorias')
      .pipe(map((r) => (r && 'data' in r ? (r.data as CategoriaResponse[]) : ([] as CategoriaResponse[]))));
  }

  getCategoria(id: number): Observable<CategoriaResponse> {
    return this.http
      .get<{ timestamp?: string; message?: string; data: CategoriaResponse }>(`http://localhost:8081/api/catalog/categorias/${id}`)
      .pipe(map((r) => (r && 'data' in r ? (r.data as CategoriaResponse) : ({} as CategoriaResponse))));
  }

  crearCategoria(data: CategoriaRequest, token: string): Observable<CategoriaResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
    return this.http.post<CategoriaResponse>('http://localhost:8081/api/catalog/categorias', data, { headers });
  }

  // Generar prefijo sugerido (respuesta text/plain)
  generarPrefijo(nombre: string): Observable<string> {
    return this.http.get('http://localhost:8081/api/catalog/categorias/prefijo', {
      params: { nombre },
      responseType: 'text'
    });
  }

  actualizarCategoria(id: number, data: CategoriaRequest, token: string): Observable<CategoriaResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
    return this.http.put<CategoriaResponse>(`http://localhost:8081/api/catalog/categorias/${id}`, data, { headers });
  }

  borrarCategoria(id: number, token: string, force = false): Observable<void> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `http://localhost:8081/api/catalog/categorias/${id}${force ? '?force=true' : ''}`;
    return this.http.delete<void>(url, { headers });
  }

  // Subcategorías
  listSubCategorias(): Observable<SubCategoriaResponse[]> {
    return this.http
      .get<{ timestamp?: string; message?: string; data: unknown[] }>('http://localhost:8081/api/catalog/sub-categorias')
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
      .get<{ timestamp?: string; message?: string; data: unknown }>(
        `http://localhost:8081/api/catalog/sub-categorias/${id}`
      )
      .pipe(map((r) => (r && 'data' in r ? this.normalizeSubCategoria(r.data) : ({} as SubCategoriaResponse))));
  }

  crearSubCategoria(data: SubCategoriaRequest, token: string): Observable<SubCategoriaResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
    const payload = { nombre: data.nombre, idCategoria: data.idCategoria };
    return this.http.post<SubCategoriaResponse>('http://localhost:8081/api/catalog/sub-categorias', payload, { headers });
  }

  actualizarSubCategoria(id: number, data: SubCategoriaRequest, token: string): Observable<SubCategoriaResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
    const payload = { nombre: data.nombre, idCategoria: data.idCategoria };
    return this.http.put<SubCategoriaResponse>(`http://localhost:8081/api/catalog/sub-categorias/${id}`, payload, { headers });
  }

  borrarSubCategoria(id: number, token: string): Observable<void> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete<void>(`http://localhost:8081/api/catalog/sub-categorias/${id}`, { headers });
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
