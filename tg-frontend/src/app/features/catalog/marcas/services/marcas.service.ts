import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MarcaResponse } from '../models/marca.models';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MarcasApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.catalogApiUrl}/api/catalog/marcas`;

  listAll(): Observable<MarcaResponse[]> {
    return this.http.get<MarcaResponse[]>(this.baseUrl);
  }

  generarCodigo(nombre: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/generar-codigo`, {
      params: { nombre },
      responseType: 'text'
    });
  }

  crearMarca(nombre: string, token: string): Observable<MarcaResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<MarcaResponse>(this.baseUrl, { nombre }, { headers });
  }

  getById(id: number): Observable<MarcaResponse> {
    return this.http.get<MarcaResponse>(`${this.baseUrl}/${id}`);
  }

  actualizarMarca(id: number, data: any, token: string): Observable<MarcaResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
    return this.http.put<MarcaResponse>(`${this.baseUrl}/${id}`, data, { headers });
  }

  borrarMarca(id: number, token: string): Observable<void> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers });
  }
}
