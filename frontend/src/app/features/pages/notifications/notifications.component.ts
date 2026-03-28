import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StateCardComponent } from '../../../shared/ui/state-card/state-card.component';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationItem } from '../../../shared/models/notification.models';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, StateCardComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  notifications: NotificationItem[] = [];
  loading = true;
  errorMessage = '';

  constructor() {
    this.notificationService.connectLiveStream();

    this.notificationService.notifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notifications) => {
        this.notifications = notifications;
      });

    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.errorMessage = '';

    this.notificationService
      .loadNotifications(40)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message ||
            'We could not load your notifications right now.';
        },
      });
  }

  markAllAsRead(): void {
    this.notificationService
      .markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  openNotification(notification: NotificationItem): void {
    const target = this.normalizeLink(notification.link);

    if (!notification.isRead) {
      this.notificationService
        .markAsRead(notification._id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.router.navigateByUrl(target),
          error: () => this.router.navigateByUrl(target),
        });

      return;
    }

    this.router.navigateByUrl(target);
  }

  private normalizeLink(link: string | null): string {
    if (!link) {
      return '/notification';
    }

    return link.startsWith('/') ? link : `/${link}`;
  }
}
