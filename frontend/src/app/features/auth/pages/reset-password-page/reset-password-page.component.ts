import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

interface ResetPasswordNavState {
  email?: string;
  resetToken?: string;
}

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.component.html',
})
export class ResetPasswordPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private location = inject(Location);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  loading = false;
  sendingOtp = false;
  error = '';
  success = '';

  step: 'email' | 'reset' = 'email';

  resetForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    resetToken: ['', [Validators.required]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(30)],
    ],
    passwordConfirm: ['', [Validators.required]],
  });

  ngOnInit(): void {
    // Read email/resetToken from router state (set by the OTP page) instead
    // of the URL, so the one-time token never appears in the address bar
    // or browser history.
    const state = (this.location.getState() as ResetPasswordNavState) || {};

    if (state.email && state.resetToken) {
      this.step = 'reset';
      this.resetForm.patchValue({
        email: state.email,
        resetToken: state.resetToken,
      });
    }
  }

  // Step 1: send OTP
  sendOtp() {
    const email = this.resetForm.get('email')?.value;

    if (!email) {
      this.resetForm.get('email')?.markAsTouched();
      return;
    }

    this.sendingOtp = true;
    this.error = '';
    this.success = '';

    this.authService
      .sendOtp('Password Recovery', email)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.sendingOtp = false)),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/otp'], {
            queryParams: {
              purpose: 'password-recovery',
              email,
            },
          });
        },
        error: (err) => {
          this.error = this.authService.getErrorMessage(err);
        },
      });
  }

  // Step 2: reset password
  submit() {
    if (this.step !== 'reset') return;

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { password, passwordConfirm, email, resetToken } =
      this.resetForm.getRawValue();

    if (password !== passwordConfirm) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService
      .resetPassword({ email, resetToken, password, passwordConfirm })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: () => {
          // resetPassword() already syncs AuthService's user state itself.
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.error = this.authService.getErrorMessage(err);
        },
      });
  }
}
