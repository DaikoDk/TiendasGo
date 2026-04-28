import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MarcaRequest, MarcaResponse } from '../models/marca.models';

@Injectable({ providedIn: 'root' })
export class MarcasService {
  private readonly http = inject(HttpClient);
  // Use el API de Catalog en el puerto 8081 según la convención del proyecto
  private readonly baseUrl = 'http://localhost:8081/api/catalog/marcas';

  getAll(): Observable<MarcaResponse[]> {
    return this.http.get<MarcaResponse[]>(this.baseUrl);
  }

  getById(id: number): Observable<MarcaResponse> {
    return this.http.get<MarcaResponse>(`${this.baseUrl}/${id}`);
  }

  create(data: MarcaRequest): Observable<MarcaResponse> {
    return this.http.post<MarcaResponse>(this.baseUrl, data);
  }

  update(id: number, data: MarcaRequest): Observable<MarcaResponse> {
    return this.http.put<MarcaResponse>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
