import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

const RESEND_COOLDOWN_SECONDS = 30;

@Component({
  selector: 'app-otp-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './otp-page.component.html',
})
export class OtpPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  loading = false;
  error = '';
  success = '';
  purpose = 'email-confirmation';
  email = '';

  resending = false;
  resendCooldown = 0;
  private cooldownIntervalId: ReturnType<typeof setInterval> | null = null;

  otpForm = this.fb.nonNullable.group({
    otp: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern(/^\d{6}$/),
      ],
    ],
  });

  ngOnInit(): void {
    this.purpose =
      this.route.snapshot.queryParamMap.get('purpose') || 'email-confirmation';

    this.email = this.route.snapshot.queryParamMap.get('email') || '';
  }

  ngOnDestroy(): void {
    this.stopCooldown();
  }

  private get backendPurpose(): 'Email Confirmation' | 'Password Recovery' {
    return this.purpose === 'password-recovery'
      ? 'Password Recovery'
      : 'Email Confirmation';
  }

  submit() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    this.otpForm.disable();

    const otp = this.otpForm.getRawValue().otp;

    this.authService
      .verifyOtp(this.backendPurpose, { email: this.email, otp })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.otpForm.enable();
        }),
      )
      .subscribe({
        next: (res: any) => {
          if (this.purpose === 'password-recovery') {
            this.success = 'OTP verified. Redirecting...';
            this.router.navigate(['/reset-password'], {
              state: { email: this.email, resetToken: res.resetToken },
            });
            return;
          }

          this.success = 'Email verified successfully. Redirecting...';
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.error = this.authService.getErrorMessage(err);
        },
      });
  }

  resendOtp() {
    if (this.resending || this.resendCooldown > 0 || !this.email) return;

    this.resending = true;
    this.error = '';
    this.success = '';

    this.authService
      .sendOtp(this.backendPurpose, this.email)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.resending = false)),
      )
      .subscribe({
        next: () => {
          this.success = 'A new code has been sent to your email.';
          this.startCooldown();
        },
        error: (err) => {
          this.error = this.authService.getErrorMessage(err);
        },
      });
  }

  private startCooldown() {
    this.resendCooldown = RESEND_COOLDOWN_SECONDS;
    this.stopCooldown();
    this.cooldownIntervalId = setInterval(() => {
      this.resendCooldown -= 1;
      if (this.resendCooldown <= 0) this.stopCooldown();
    }, 1000);
  }

  private stopCooldown() {
    if (this.cooldownIntervalId !== null) {
      clearInterval(this.cooldownIntervalId);
      this.cooldownIntervalId = null;
    }
  }
}
