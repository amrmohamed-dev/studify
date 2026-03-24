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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = '/api/v1';
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
    return this.http
      .post<any>(`${this.api}/auth/register`, data)
      .pipe(tap((res) => this.userSubject.next(res.data.user)));
  }

  sendOtp(purpose: 'Email Confirmation' | 'Password Recovery', email?: string) {
    return this.http.post(
      `${this.api}/auth/send-otp/${encodeURIComponent(purpose)}`,
      { email },
    );
  }

  verifyOtp(purpose: string, data: { email: string; otp: string }) {
    return this.http.post(`${this.api}/auth/verify-otp/${purpose}`, data);
  }

  verifyEmail(otp: string) {
    return this.http.patch(`${this.api}/auth/verify-email`, { otp });
  }

  resetPassword(data: any) {
    return this.http.patch(`${this.api}/auth/reset-password`, data);
  }

  getErrorMessage(err: any): string {
    if (err?.status === 401) return 'Invalid email or password';
    if (err?.status === 0) return 'Server unreachable';
    return err?.error?.message || 'Something went wrong';
  }
}
