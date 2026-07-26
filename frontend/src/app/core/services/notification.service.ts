import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../models/api.model';

export interface AppNotification {
  _id: string;
  recipient: User;
  sender: User | null;
  type: string;
  message: string | null;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private baseUrl = environment.apiUrl + '/notifications';

  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  fetchNotifications(): Observable<
    ApiResponse<{ notifications: AppNotification[] }>
  > {
    return this.http
      .get<ApiResponse<{ notifications: AppNotification[] }>>(this.baseUrl)
      .pipe(
        tap((res) => {
          const list = res.data?.notifications ?? [];
          this.notificationsSubject.next(list);
          this.unreadCountSubject.next(list.filter((n) => !n.isRead).length);
        }),
      );
  }

  markAsRead(id: string): Observable<ApiResponse<any>> {
    return this.http
      .patch<ApiResponse<any>>(`${this.baseUrl}/${id}/read`, {})
      .pipe(
        tap(() => {
          const updated = this.notificationsSubject.value.map((n) =>
            n._id === id ? { ...n, isRead: true } : n,
          );
          this.notificationsSubject.next(updated);
          this.unreadCountSubject.next(
            updated.filter((n) => !n.isRead).length,
          );
        }),
      );
  }

  markAllAsRead(): Observable<ApiResponse<any>> {
    return this.http
      .patch<ApiResponse<any>>(`${this.baseUrl}/read-all`, {})
      .pipe(
        tap(() => {
          const updated = this.notificationsSubject.value.map((n) => ({
            ...n,
            isRead: true,
          }));
          this.notificationsSubject.next(updated);
          this.unreadCountSubject.next(0);
        }),
      );
  }

  /** Called by the socket listener when a new notification arrives in real time */
  addIncoming(notification: AppNotification): void {
    const updated = [notification, ...this.notificationsSubject.value];
    this.notificationsSubject.next(updated);
    this.unreadCountSubject.next(updated.filter((n) => !n.isRead).length);
  }
}
