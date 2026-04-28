import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoriaResponse } from '../models/categoria.models';
import { SubCategoriaResponse } from '../models/subcategoria.models';

interface ApiResponse<T> {
  timestamp: string;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly baseCategorias = 'http://localhost:8081/api/catalog/categorias';
  private readonly baseSubCategorias = 'http://localhost:8081/api/catalog/sub-categorias';

  getAllCategorias(): Observable<CategoriaResponse[]> {
    return this.http.get<ApiResponse<unknown[]>>(this.baseCategorias).pipe(
      map((r) => {
        const items = (r && 'data' in r ? (r.data as unknown[]) : []);
        return items.map((it) => this.normalizeCategoria(it));
      })
    );
  }

  getCategoriaById(id: number): Observable<CategoriaResponse> {
    return this.http.get<ApiResponse<unknown>>(`${this.baseCategorias}/${id}`).pipe(
      map((r) => {
        const src = (r && 'data' in r ? r.data : r);
        return this.normalizeCategoria(src as unknown);
      })
    );
  }

  getAllSubCategorias(): Observable<SubCategoriaResponse[]> {
    return this.http.get<ApiResponse<SubCategoriaResponse[]>>(this.baseSubCategorias)
      .pipe(map(r => r.data));
  }

  getSubCategoriaById(id: number): Observable<SubCategoriaResponse> {
    return this.http.get<ApiResponse<SubCategoriaResponse>>(`${this.baseSubCategorias}/${id}`)
      .pipe(map(r => r.data));
  }

  private normalizeCategoria(raw: unknown): CategoriaResponse {
    const src = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
    const id = typeof src['id'] === 'number' ? src['id'] as number : Number(src['id'] ?? 0);
    const nombre = typeof src['nombre'] === 'string' ? (src['nombre'] as string) : String(src['nombre'] ?? '');
    const prefijo = src['prefijo'] == null ? null : String(src['prefijo']);
    const estado = typeof src['activo'] === 'boolean' ? (src['activo'] as boolean) : Boolean(src['estado'] ?? src['activo']);

    return {
      id: Number.isFinite(Number(id)) ? id : 0,
      nombre: nombre ?? '',
      prefijo: prefijo ?? null,
      estado: Boolean(estado)
    } as CategoriaResponse;
  }
}