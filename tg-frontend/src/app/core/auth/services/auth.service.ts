import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly authUrl = `${environment.apiUrl}/api/auth`;
  private isLoggingOut = false;

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.authenticate(payload, true).pipe(
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  validateAdminCredentials(payload: LoginRequest): Observable<LoginResponse> {
    return this.authenticate(payload, false).pipe(
      map((session) => {
        if (!this.isAdminRole(session.rol)) {
          const detectedRole = session.rol.trim().length > 0 ? session.rol : '(sin rol)';
          throw new Error(
            `Las credenciales ingresadas no pertenecen a un administrador. Rol detectado: ${detectedRole}`
          );
        }

        return session;
      })
    );
  }

  logout(): Observable<void> {
    if (this.isLoggingOut) {
      return of(void 0);
    }

    this.isLoggingOut = true;

    const token = this.tokenStorage.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.post<void>(`${this.authUrl}/logout`, {}, { headers }).pipe(
      catchError(() => of(void 0)),
      finalize(() => {
        this.clearSession();
        this.isLoggingOut = false;
        void this.router.navigateByUrl('/login');
      })
    );
  }

  clearSession(): void {
    this.tokenStorage.clearSession();
  }

  private authenticate(payload: LoginRequest, persistSession: boolean): Observable<LoginResponse> {
    return this.http.post<unknown>(`${this.authUrl}/login`, payload).pipe(
      map((response) => this.normalizeLoginResponse(response)),
      map((session) => {
        if (persistSession) {
          this.tokenStorage.saveSession(session);

          if (!this.tokenStorage.getToken()) {
            throw new Error('Token JWT invalido en respuesta de login.');
          }
        }

        return session;
      })
    );
  }

  private normalizeLoginResponse(raw: unknown): LoginResponse {
    const source = this.unwrapData(raw);

    const userSource = this.toRecord(source['usuario']) ?? this.toRecord(source['user']) ?? source;
    const tokenCandidate =
      source['token'] ?? source['accessToken'] ?? source['jwt'] ?? source['bearerToken'];

    const token = typeof tokenCandidate === 'string' ? tokenCandidate : '';

    if (token.trim().length === 0) {
      throw new Error('Respuesta de login sin token.');
    }

    const roleFromBody = this.readRole(
      userSource['rol'] ??
        userSource['role'] ??
        userSource['authority'] ??
        userSource['authorities'] ??
        source['rol'] ??
        source['role'] ??
        source['authority'] ??
        source['authorities']
    );

    const roleFromToken = this.readRoleFromToken(token);

    return {
      token,
      userId: this.readNumber(userSource['userId'] ?? userSource['idUsuario'] ?? userSource['id']),
      email: this.readString(userSource['email'] ?? userSource['correo']),
      nombreCompleto: this.readString(
        userSource['nombreCompleto'] ?? userSource['nombre'] ?? userSource['name']
      ),
      rol: roleFromBody.trim().length > 0 ? roleFromBody : roleFromToken
    };
  }

  private unwrapData(raw: unknown): Record<string, unknown> {
    const source = this.toRecord(raw) ?? {};

    if ('data' in source) {
      return this.toRecord(source['data']) ?? source;
    }

    return source;
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private readString(value: unknown): string {
    if (Array.isArray(value)) {
      const first = value[0];
      return typeof first === 'string' ? first : '';
    }

    return typeof value === 'string' ? value : '';
  }

  private readRole(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const extracted = this.readRole(item);
        if (extracted.trim().length > 0) {
          return extracted;
        }
      }

      return '';
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return this.readString(
        record['authority'] ?? record['role'] ?? record['rol'] ?? record['nombre'] ?? record['name']
      );
    }

    return '';
  }

  private readNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private normalizeRole(value: string): string {
    return value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/^ROLE_/, '')
      .replace(/\s+/g, '_');
  }

  private isAdminRole(role: string): boolean {
    const normalized = this.normalizeRole(role);
    return (
      normalized === 'ADMIN' ||
      normalized === 'ADMINISTRADOR' ||
      normalized.includes('ADMINISTRADOR') ||
      normalized.includes('ROLE_ADMIN')
    );
  }

  private readRoleFromToken(token: string): string {
    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return '';
    }

    const direct = this.readRole(
      payload['roles'] ??
        payload['rol'] ??
        payload['role'] ??
        payload['authority'] ??
        payload['authorities'] ??
        payload['scope'] ??
        payload['scopes']
    );

    if (direct.trim().length > 0) {
      return direct;
    }

    return this.readRole(payload['permissions'] ?? payload['permisos']);
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    const normalizedToken = token.replace(/^Bearer\s+/i, '').trim();
    const parts = normalizedToken.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const jsonPayload = atob(padded);
      return JSON.parse(jsonPayload) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
