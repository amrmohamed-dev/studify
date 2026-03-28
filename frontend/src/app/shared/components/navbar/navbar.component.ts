import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SocketService } from '../../../core/services/socket.service';
import { NotificationItem } from '../../models/notification.models';
import {
  Bell,
  House,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  LucideAngularModule,
} from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    AsyncPipe,
    DatePipe,
    RouterLinkActive,
    LucideAngularModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationService = inject(NotificationService);
  private readonly socketService = inject(SocketService);

  readonly user$ = this.auth.user$;

  readonly icons = {
    bell: Bell,
    home: House,
    rooms: LayoutDashboard,
    friends: Users,
    settings: Settings,
    logout: LogOut,
  };

  notifications: NotificationItem[] = [];
  unreadCount = 0;

  showNotif = false;
  showUserMenu = false;
  isMenuOpen = false;

  constructor() {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.closeMenu());

    this.auth.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (!user) {
          this.notifications = [];
          this.unreadCount = 0;
          return;
        }

        this.notificationService.connectLiveStream();
        this.notificationService
          .loadNotifications(8)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
      });

    this.notificationService.notifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notifications) => {
        this.notifications = notifications.slice(0, 5);
        this.unreadCount = notifications.filter((item) => !item.isRead).length;
      });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  toggleNotif(): void {
    this.showNotif = !this.showNotif;
    this.showUserMenu = false;
  }

  toggleUser(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotif = false;
  }

  @HostListener('document:click', ['$event'])
  closeMenus(event: Event): void {
    if (!(event.target as HTMLElement).closest('.nav-right')) {
      this.showNotif = false;
      this.showUserMenu = false;
    }
  }

  stopDropdownClose(event: MouseEvent): void {
    event.stopPropagation();
  }

  logout(): void {
    this.socketService.disconnect();
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
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
    } else {
      this.router.navigateByUrl(target);
    }

    this.showNotif = false;
  }

  getInitials(name?: string | null): string {
    return name
      ? name
          .split(' ')
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? '')
          .join('')
      : 'SU';
  }

  private normalizeLink(link: string | null): string {
    if (!link) {
      return '/notification';
    }

    return link.startsWith('/') ? link : `/${link}`;
  }
}
