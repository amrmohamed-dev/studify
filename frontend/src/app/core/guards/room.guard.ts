import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoomService } from '../services/room.service';
import { catchError, map, of } from 'rxjs';

export const roomGuard: CanActivateFn = (route, state) => {
  const roomService = inject(RoomService);
  const router = inject(Router);

  const roomId = route.paramMap.get('roomId');

  if (!roomId) {
    router.navigate(['/rooms']);
    return false;
  }

  return roomService.getRoom(roomId).pipe(
    map(() => {
      return true;
    }),
    catchError(() => {
      router.navigate(['/rooms']);
      return of(false);
    })
  );
};
