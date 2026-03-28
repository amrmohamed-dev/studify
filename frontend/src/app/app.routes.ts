import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { otpGuard } from './core/guards/otp.guard';
import { roomGuard } from './core/guards/room.guard';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'home',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/pages/home/home.component').then(
            (m) => m.HomeComponent,
          ),
        data: {
          title: 'Study Better Together',
          description:
            'Studify gives students a simple space to join rooms, stay in touch with friends, and keep learning moving.',
          actionLabel: 'Explore Rooms',
          actionLink: '/rooms',
        },
      },
      {
        path: 'rooms',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/rooms/pages/rooms-page.component').then(
            (m) => m.RoomsPageComponent,
          ),
      },
      {
        path: 'rooms/join',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/rooms/pages/join-room-page.component').then(
            (m) => m.JoinRoomPageComponent,
          ),
      },
      {
        path: 'rooms/request-sent',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/rooms/pages/request-sent-page.component').then(
            (m) => m.RequestSentPageComponent,
          ),
      },
      {
        path: 'rooms/:roomId',
        canActivate: [authGuard, roomGuard],
        loadComponent: () =>
          import('./features/rooms/pages/room-detail-page.component').then(
            (m) => m.RoomDetailPageComponent,
          ),
      },
      {
        path: 'friends',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/pages/friends/friends.component').then(
            (m) => m.FriendsComponent,
          ),
        data: {
          title: 'Friends',
          description:
            'See your study network, connect with classmates, and collaborate without extra clutter.',
          actionLabel: 'Open Notifications',
          actionLink: '/notification',
        },
      },
      {
        path: 'notification',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/pages/notifications/notifications.component').then(
            (m) => m.NotificationsComponent,
          ),
        data: {
          title: 'Notifications',
          description:
            'Review recent updates from rooms, friends, and account activity in a clean feed.',
          actionLabel: 'View Friends',
          actionLink: '/friends',
        },
      },
      {
        path: 'notifications',
        pathMatch: 'full',
        redirectTo: 'notification',
      },
      {
        path: 'request-sent',
        pathMatch: 'full',
        redirectTo: 'rooms/request-sent',
      },
      {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/pages/simple-page/simple-page.component').then(
            (m) => m.SimplePageComponent,
          ),
      },
    ],
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/login-page/login-page.component').then(
            (m) => m.LoginPageComponent,
          ),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/register-page/register-page.component').then(
            (m) => m.RegisterPageComponent,
          ),
      },
      {
        path: 'otp',
        canActivate: [otpGuard],
        loadComponent: () =>
          import('./features/auth/pages/otp-page/otp-page.component').then(
            (m) => m.OtpPageComponent,
          ),
      },
      {
        path: 'reset-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/reset-password-page/reset-password-page.component').then(
            (m) => m.ResetPasswordPageComponent,
          ),
      },
    ],
  },
  {
    path: 'rooms/:roomId/settings',
    canActivate: [authGuard, roomGuard],
    loadComponent: () =>
      import('./features/room-settings/room-settings/room-settings.component').then(
        (m) => m.RoomSettingsComponent,
      ),
    data: { mode: 'edit' },
  },
  {
    path: 'rooms/create',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/room-settings/room-settings/room-settings.component').then(
        (m) => m.RoomSettingsComponent,
      ),
    data: { mode: 'create' },
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
