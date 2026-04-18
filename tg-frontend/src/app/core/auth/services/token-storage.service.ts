import { Injectable } from '@angular/core';

import { LoginResponse, SessionUser } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly tokenKey = 'token';
  private readonly userKey = 'sessionUser';
  private readonly storage = sessionStorage;

  saveSession(session: LoginResponse): void {
    const token = this.normalizeToken(session.token);
    if (!token) {
      this.clearSession();
      return;
    }

    const safeSession: LoginResponse = {
      ...session,
      token
    };

    this.storage.setItem(this.tokenKey, token);
    this.storage.setItem(this.userKey, JSON.stringify(safeSession));
  }

  getToken(): string | null {
    return this.normalizeToken(this.storage.getItem(this.tokenKey));
  }

  getSessionUser(): SessionUser | null {
    const raw = this.storage.getItem(this.userKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;

      return {
        userId: this.toNumber(parsed['userId']),
        email: this.toString(parsed['email']),
        nombreCompleto: this.toString(parsed['nombreCompleto']),
        rol: this.toString(parsed['rol'])
      };
    } catch {
      return null;
    }
  }

  getUserRole(): string | null {
    const user = this.getSessionUser();
    if (!user) {
      return this.readRoleFromToken(this.getToken());
    }

    const normalized = user.rol.trim();
    return normalized.length > 0 ? normalized : this.readRoleFromToken(this.getToken());
  }

  isAdmin(): boolean {
    const role = this.getUserRole();
    if (!role) {
      return false;
    }

    const normalized = this.normalizeRole(role);
    return (
      normalized === 'ADMIN' ||
      normalized === 'ADMINISTRADOR' ||
      normalized.includes('ADMINISTRADOR') ||
      normalized.includes('ROLE_ADMIN')
    );
  }

  clearSession(): void {
    this.storage.removeItem(this.tokenKey);
    this.storage.removeItem(this.userKey);
  }

  private normalizeToken(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    let normalized = value.trim();

    // Some backends return tokens as: "Bearer <jwt>". Store only the raw JWT.
    normalized = normalized.replace(/^Bearer\s+/i, '').trim();

    // Defensive cleanup for accidentally quoted tokens.
    normalized = normalized.replace(/^"|"$/g, '').trim();

    if (
      normalized.length === 0 ||
      normalized.toLowerCase() === 'undefined' ||
      normalized.toLowerCase() === 'null'
    ) {
      return null;
    }

    return normalized;
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

  private readRoleFromToken(token: string | null): string | null {
    if (!token) {
      return null;
    }

    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return null;
    }

    const role = this.readRole(
      payload['roles'] ??
        payload['rol'] ??
        payload['role'] ??
        payload['authority'] ??
        payload['authorities'] ??
        payload['scope'] ??
        payload['scopes']
    );

    return role.trim().length > 0 ? role : null;
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
      return this.toString(
        record['authority'] ?? record['role'] ?? record['rol'] ?? record['nombre'] ?? record['name']
      );
    }

    return '';
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
