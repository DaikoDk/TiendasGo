import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getToken();

  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const isLoginRequest = req.url.includes('/api/auth/login');
  const isLogoutRequest = req.url.includes('/api/auth/logout');
  const hasAuthorizationHeader = req.headers.has('Authorization');
  const sessionAuthorization = token ? `Bearer ${token}` : '';

  const shouldAttachSessionToken =
    Boolean(token) &&
    isApiRequest &&
    !isLoginRequest &&
    !isLogoutRequest &&
    !hasAuthorizationHeader;

  const requestToHandle =
    !shouldAttachSessionToken
      ? req
      : req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });

  return next(requestToHandle).pipe(
    catchError((error: unknown) => {
      // Keep the current session and let each view handle 401/403 messages.
      // This avoids unexpected redirects to /login while navigating guarded routes.
      const _isRecoverableApiAuthError =
        error instanceof HttpErrorResponse &&
        isApiRequest &&
        !isLoginRequest &&
        !isLogoutRequest &&
        (error.status === 401 || error.status === 403);

      return throwError(() => error);
    })
  );
};
