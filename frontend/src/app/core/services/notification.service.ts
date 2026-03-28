import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, Observable, Subscription } from 'rxjs';
import {
  NotificationItem,
  NotificationListResult,
} from '../../shared/models/notification.models';
import { ApiMeta } from '../../shared/models/room.models';
import { SocketService } from './socket.service';
import { SOCKET_EVENTS } from '../../shared/models/socket-events';

interface NotificationsResponse {
  status: string;
  meta: ApiMeta;
  data: {
    notifications: NotificationItem[];
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly socketService = inject(SocketService);
  private readonly api = '/api/v1/notifications';

  private readonly notificationsSubject = new BehaviorSubject<
    NotificationItem[]
  >([]);
  private readonly metaSubject = new BehaviorSubject<ApiMeta | null>(null);

  private streamSubscription?: Subscription;

  readonly notifications$ = this.notificationsSubject.asObservable();
  readonly meta$ = this.metaSubject.asObservable();

  connectLiveStream(): void {
    if (this.streamSubscription) {
      return;
    }

    this.socketService.connect();
    this.streamSubscription = this.socketService
      .listen<{ notification: NotificationItem }>(SOCKET_EVENTS.NOTIFICATION_NEW)
      .subscribe(({ notification }) => {
        this.upsert(notification);
      });
  }

  loadNotifications(limit = 20, page = 1): Observable<NotificationListResult> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());

    return this.http
      .get<NotificationsResponse>(this.api, { params })
      .pipe(
        map((response) => {
          this.notificationsSubject.next(response.data.notifications);
          this.metaSubject.next(response.meta);

          return {
            items: response.data.notifications,
            meta: response.meta,
          };
        }),
      );
  }

  markAsRead(id: string): Observable<NotificationItem> {
    return this.http
      .patch<{ data: { notification: NotificationItem } }>(
        `${this.api}/${id}/read`,
        {},
      )
      .pipe(
        map((response) => {
          this.upsert({ ...response.data.notification, isRead: true });
          return response.data.notification;
        }),
      );
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.api}/read-all`, {}).pipe(
      map(() => {
        this.notificationsSubject.next(
          this.notificationsSubject.value.map((notification) => ({
            ...notification,
            isRead: true,
          })),
        );
      }),
    );
  }

  getSnapshot(): NotificationItem[] {
    return this.notificationsSubject.value;
  }

  unreadCount(): number {
    return this.notificationsSubject.value.filter((item) => !item.isRead).length;
  }

  private upsert(notification: NotificationItem): void {
    const current = this.notificationsSubject.value;
    const existingIndex = current.findIndex((item) => item._id === notification._id);

    if (existingIndex === -1) {
      this.notificationsSubject.next([notification, ...current]);
      return;
    }

    const next = [...current];
    next[existingIndex] = {
      ...next[existingIndex],
      ...notification,
    };
    this.notificationsSubject.next(next);
  }
}
