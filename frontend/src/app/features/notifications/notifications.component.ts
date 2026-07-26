import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  NotificationService,
  AppNotification,
} from '../../core/services/notification.service';
import { SocketService } from '../../core/services/socket.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  loading = false;

  constructor(
    private notificationService: NotificationService,
    private socketService: SocketService,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.notificationService.fetchNotifications().subscribe({
      next: () => (this.loading = false),
      error: () => (this.loading = false),
    });

    this.notificationService.notifications$.subscribe((list) => {
      this.notifications = list;
    });

    this.socketService.onNewNotification(({ notification }) => {
      this.notificationService.addIncoming(notification);
    });
  }

  ngOnDestroy(): void {
    this.socketService.removeNotificationListener();
  }

  markAsRead(notification: AppNotification): void {
    if (notification.isRead) return;
    this.notificationService.markAsRead(notification._id).subscribe();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }
}
