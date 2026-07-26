import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/api.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = environment.apiUrl;
  private http = inject(HttpClient);

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  private me$?: Observable<any>;
  private isFetchingMe = false;
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getCurrentUserId(): string | undefined {
    return this.userSubject.value?._id;
  }

  setUser(user: User | null) {
    this.userSubject.next(user);
  }

  getMe() {
    if (this.userSubject.value) {
      this.loadingSubject.next(false);
      return of({ data: { user: this.userSubject.value } });
    }

    if (this.me$) return this.me$;

    this.isFetchingMe = true;

    this.me$ = this.http.get<any>(`${this.api}/users/me`).pipe(
      tap((res) => {
        this.userSubject.next(res.data.user);
        this.loadingSubject.next(false);
        this.isFetchingMe = false;
      }),
      catchError((err) => {
        this.loadingSubject.next(false);
        this.isFetchingMe = false;
        this.me$ = undefined;
        return throwError(() => err);
      }),
      shareReplay(1),
    );

    return this.me$;
  }

  clearUser() {
    this.userSubject.next(null);
    this.me$ = undefined;
    this.loadingSubject.next(false);
  }

  login(data: { email: string; password: string }) {
    return this.http.post<any>(`${this.api}/auth/login`, data).pipe(
      tap((res) => {
        this.userSubject.next(res.data.user);
        this.me$ = undefined;
      }),
    );
  }

  logout() {
    return this.http.post(`${this.api}/auth/logout`, {}).pipe(
      tap(() => {
        this.clearUser();
      }),
    );
  }

  register(data: {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
  }) {
    return this.http.post<any>(`${this.api}/auth/register`, data).pipe(
      tap((res) => {
        this.userSubject.next(res.data.user);
        this.me$ = undefined;
      }),
    );
  }

  sendOtp(purpose: 'Email Confirmation' | 'Password Recovery', email: string) {
    return this.http.post(
      `${this.api}/auth/send-otp/${encodeURIComponent(purpose)}`,
      { email },
    );
  }

  verifyOtp(
    purpose: 'Email Confirmation' | 'Password Recovery',
    data: { email: string; otp: string },
  ) {
    return this.http
      .post<any>(
        `${this.api}/auth/verify-otp/${encodeURIComponent(purpose)}`,
        data,
      )
      .pipe(
        tap((res) => {
          if (purpose === 'Email Confirmation' && res?.data?.user) {
            this.userSubject.next(res.data.user);
            this.me$ = undefined;
          }
        }),
      );
  }

  resetPassword(data: {
    email: string;
    resetToken: string;
    password: string;
    passwordConfirm: string;
  }) {
    return this.http.patch<any>(`${this.api}/auth/reset-password`, data).pipe(
      tap((res) => {
        if (res?.data?.user) {
          this.userSubject.next(res.data.user);
          this.me$ = undefined;
        }
      }),
    );
  }

  getErrorMessage(err: any): string {
    if (err?.status === 401) return 'Invalid email or password';
    if (err?.status === 0) return 'Server unreachable';
    return err?.error?.message || 'Something went wrong';
  }
}
