import { HttpErrorResponse } from '@angular/common/http';

export function readApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return 'Tu sesion expiro. Inicia sesion nuevamente.';
    }

    if (error.status === 403) {
      return 'No autorizado';
    }

    const source = error.error as unknown;
    if (typeof source === 'string' && source.trim().length > 0) {
      return source;
    }

    if (source && typeof source === 'object') {
      const record = source as Record<string, unknown>;
      const message = record['message'] ?? record['error'];
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
