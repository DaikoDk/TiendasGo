import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MarcaResponse } from '../models/marca.models';

interface AuthResponse {
  token: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class MarcasApiService {
  private readonly http = inject(HttpClient);

  // Autenticación: devuelve { token, rol }
  authLogin(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('http://localhost:8080/api/auth/login', { email, password });
  }

  // Generar código sugerido (respuesta text/plain)
  generarCodigo(nombre: string): Observable<string> {
    return this.http.get('http://localhost:8081/api/catalog/marcas/generar-codigo', {
      params: { nombre },
      responseType: 'text'
    });
  }

  // Crear marca (usa token ADMIN en Authorization)
  crearMarca(nombre: string, token: string): Observable<MarcaResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<MarcaResponse>('http://localhost:8081/api/catalog/marcas', { nombre }, { headers });
  }

  // Actualizar marca (no modifica codigoMarca)
  actualizarMarca(id: number, nombre: string, token: string): Observable<MarcaResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
    return this.http.put<MarcaResponse>(`http://localhost:8081/api/catalog/marcas/${id}`, { nombre }, { headers });
  }

  // Borrar marca (ADMIN)
  borrarMarca(id: number, token: string): Observable<void> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete<void>(`http://localhost:8081/api/catalog/marcas/${id}`, { headers });
  }
}
