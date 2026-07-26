import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { otpGuard } from './core/guards/otp.guard';
import { roomGuard } from './core/guards/room.guard';


export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },

  {
    path: 'home',
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
    
    loadComponent: () =>
      import('./features/all-rooms/all-rooms.component')
        .then(m => m.AllRoomsComponent),
  },


  {
    path: 'rooms/join',
    
    loadComponent: () =>
      import('./features/join-room/join-room.component')
        .then(m => m.JoinRoomComponent),
  },

  {
    path: 'request-sent',
    loadComponent: () =>
      import('./features/request-sent/request-sent.component')
        .then(m => m.RequestSentComponent),
  },


  {
    path: 'rooms/join',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/simple-page/simple-page.component').then(
        (m) => m.SimplePageComponent,
      ),
    data: {
      title: 'Join a Room',
      description: 'Find and join a study room to collaborate with others.',
      actionLabel: 'Back to Rooms',
      actionLink: '/rooms',
    },
  },
  {
    path: 'rooms/:roomId',
    canActivate: [authGuard,roomGuard],
    loadComponent: () =>
      import('./features/pages/room/room.component').then(
        (m) => m.RoomComponent,
      ),
  },
  {
    path: 'rooms/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/simple-page/simple-page.component').then(
        (m) => m.SimplePageComponent,
      ),
    data: {
      title: 'Room',
      description: 'Your study room.',
      actionLabel: 'Back to Rooms',
      actionLink: '/rooms',
    },
  },
  {
    path: 'rooms/:roomId/settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/room-settings/room-settings/room-settings.component').then(
        (m) => m.RoomSettingsComponent
      ),
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
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pages/simple-page/simple-page.component').then(
        (m) => m.SimplePageComponent,
      ),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component')
        .then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/register-page/register-page.component')
        .then((m) => m.RegisterPageComponent),
  },
  {
    path: 'otp',
    canActivate: [otpGuard],
    loadComponent: () =>
      import('./features/auth/pages/otp-page/otp-page.component')
        .then((m) => m.OtpPageComponent),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/reset-password-page/reset-password-page.component')
        .then((m) => m.ResetPasswordPageComponent),
  },
  
  {
    path: '**',
    redirectTo: 'home',
  },
];