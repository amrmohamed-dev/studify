import { AsyncPipe } from '@angular/common';
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  NotificationService,
  AppNotification,
} from '../../../core/services/notification.service';
import { SocketService } from '../../../core/services/socket.service';
import {
  LucideAngularModule,
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  House,
  Bell,
} from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, AsyncPipe, RouterLinkActive, LucideAngularModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit, OnDestroy {
  icons = {
    home: House,
    rooms: LayoutDashboard,
    friends: Users,
    settings: Settings,
    logout: LogOut,
  };

  showNotif = false;
  showUserMenu = false;
  isMenuOpen = false;

  user$ = this.auth.user$;

  notifications: AppNotification[] = [];
  unreadCount = 0;

  constructor(
    public auth: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private socketService: SocketService,
  ) {
    this.router.events.subscribe(() => {
      this.closeMenu();
    });
  }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) return;

    this.notificationService.fetchNotifications().subscribe();

    this.notificationService.notifications$.subscribe((list) => {
      this.notifications = list.slice(0, 5);
    });

    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });

    this.socketService.onNewNotification(({ notification }) => {
      this.notificationService.addIncoming(notification);
    });
  }

  ngOnDestroy(): void {
    this.socketService.removeNotificationListener();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  toggleNotif() {
    this.showNotif = !this.showNotif;
    this.showUserMenu = false;
  }

  toggleUser() {
    this.showUserMenu = !this.showUserMenu;
    this.showNotif = false;
  }

  @HostListener('document:click', ['$event'])
  closeMenus(event: Event) {
    if (!(event.target as HTMLElement).closest('.nav-right')) {
      this.showNotif = false;
      this.showUserMenu = false;
    }
  }

  stopDropdownClose(event: MouseEvent) {
    event.stopPropagation();
  }

  logout() {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  getInitials(name?: string | null) {
    return name
      ? name
          .split(' ')
          .slice(0, 2)
          .map((n) => n[0].toUpperCase())
          .join('')
      : 'SU';
  }
}
