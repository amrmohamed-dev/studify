import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.component.html',
})
export class ResetPasswordPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  loading = false;
  sendingOtp = false;
  error = '';
  success = '';

  step: 'email' | 'reset' = 'email';

  resetForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    otp: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(30)],
    ],
    passwordConfirm: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const otp = this.route.snapshot.queryParamMap.get('otp');

    if (email && otp) {
      this.step = 'reset';
      this.resetForm.patchValue({ email, otp });
    }
  }

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

  submit() {
    if (this.step !== 'reset') return;

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { password, passwordConfirm, email, otp } =
      this.resetForm.getRawValue();

    if (password !== passwordConfirm) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService
      .resetPassword({ email, otp, password, passwordConfirm })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.error = this.authService.getErrorMessage(err);
        },
      });
  }
}
