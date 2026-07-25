import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-otp-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './otp-page.component.html',
})
export class OtpPageComponent implements OnInit {
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

    if (this.purpose === 'password-recovery') {
      this.authService
        .verifyOtp('Password Recovery', { email: this.email, otp })
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.loading = false;
            this.otpForm.enable();
          }),
        )
        .subscribe({
          next: () => {
            this.success = 'OTP verified. Redirecting...';
            this.router.navigate(['/reset-password'], {
              queryParams: { email: this.email, otp },
            });
          },
          error: (err) => {
            this.error = this.authService.getErrorMessage(err);
          },
        });

      return;
    }

    this.authService
      .verifyEmail(otp)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.otpForm.enable();
        }),
      )
      .subscribe({
        next: () => {
          this.success = 'Email verified successfully. Redirecting...';
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.error = this.authService.getErrorMessage(err);
        },
      });
  }
}
