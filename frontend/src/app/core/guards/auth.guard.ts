import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

const redirectIfUnverified = (
  isVerified: boolean | undefined,
  email: string | undefined,
  router: Router,
) => {
  if (isVerified) return true;

  return router.createUrlTree(['/otp'], {
    queryParams: { purpose: 'email-confirmation', email },
  });
};

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    const user = auth.getCurrentUser();
    return redirectIfUnverified(user?.isVerified, user?.email, router);
  }

  return auth.getMe().pipe(
    map((res: any) => {
      const user = res?.data?.user;
      return redirectIfUnverified(user?.isVerified, user?.email, router);
    }),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
