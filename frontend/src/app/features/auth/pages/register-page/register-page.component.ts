import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  loading = false;
  error = '';

  registerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(30)],
    ],
    confirmPassword: ['', [Validators.required]],
  });

  submit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.getRawValue();

    if (formValue.password !== formValue.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.registerForm.disable();

    this.authService
      .register({
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        passwordConfirm: formValue.confirmPassword,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.registerForm.enable();
        }),
      )
      .subscribe({
        next: () => {
          // /auth/register already triggers the confirmation OTP email on
          // the backend, so we just go straight to the OTP page. The
          // "Resend" option there covers the case where that send failed.
          this.router.navigate(['/otp'], {
            queryParams: {
              purpose: 'email-confirmation',
              email: formValue.email,
            },
          });
        },
        error: (err) => {
          this.error = this.authService.getErrorMessage(err);
        },
      });
  }
}
