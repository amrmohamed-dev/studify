import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const otpGuard: CanActivateFn = (route) => {
  const router = inject(Router);

  const email = route.queryParamMap.get('email');
  const purpose = route.queryParamMap.get('purpose');

  if (!email || !purpose) {
    return router.createUrlTree(['/register']);
  }

  const allowedPurposes = ['email-confirmation', 'password-recovery'];

  if (!allowedPurposes.includes(purpose)) {
    return router.createUrlTree(['/register']);
  }

  return true;
};
