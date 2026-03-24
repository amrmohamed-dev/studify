import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { otpGuard } from './core/guards/otp.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./features/pages/simple-page/simple-page.component').then(
        (m) => m.SimplePageComponent,
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
      import('./features/pages/simple-page/simple-page.component').then(
        (m) => m.SimplePageComponent,
      ),
    data: {
      title: 'Rooms',
      description:
        'Browse study rooms, join active discussions, and keep shared tasks organized in one place.',
      actionLabel: 'Back Home',
      actionLink: '/home',
    },
  },
  {
    path: 'friends',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/simple-page/simple-page.component').then(
        (m) => m.SimplePageComponent,
      ),
    data: {
      title: 'Friends',
      description:
        'See your study network, connect with classmates, and collaborate without extra clutter.',
      actionLabel: 'Open Notifications',
      actionLink: '/notifications',
    },
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/simple-page/simple-page.component').then(
        (m) => m.SimplePageComponent,
      ),
    data: {
      title: 'Settings',
      description:
        'Manage your account details, profile preferences, and session settings from a single screen.',
      actionLabel: 'Go To Login',
      actionLink: '/login',
    },
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/simple-page/simple-page.component').then(
        (m) => m.SimplePageComponent,
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
    canActivate: [otpGuard, guestGuard],
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

  {
    path: '**',
    redirectTo: 'home',
  },
];
