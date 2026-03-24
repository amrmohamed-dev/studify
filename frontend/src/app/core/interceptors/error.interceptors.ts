import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isApiRequest = req.url.startsWith('/api/');
  const request = isApiRequest ? req.clone({ withCredentials: true }) : req;
  const isAuthRequest = request.url.includes('/auth/');

  return next(request).pipe(
    catchError((error) => {
      if (error.status === 401 && !isAuthRequest) {
        authService.clearUser();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
