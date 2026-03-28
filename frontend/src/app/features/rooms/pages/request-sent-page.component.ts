import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SocketService } from '../../../core/services/socket.service';
import { SOCKET_EVENTS } from '../../../shared/models/socket-events';

@Component({
  selector: 'app-request-sent-page',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './request-sent-page.component.html',
  styleUrl: './request-sent-page.component.scss',
})
export class RequestSentPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly socketService = inject(SocketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly connected$ = this.socketService.connected$;

  roomId = '';
  roomName = '';
  rejected = false;

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.roomId = params.get('room') ?? '';
        this.roomName = params.get('name') ?? 'this room';
      });

    this.socketService.connect();

    this.socketService
      .listen<{ roomId: string }>(SOCKET_EVENTS.ROOM_APPROVED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ roomId }) => {
        if (roomId === this.roomId) {
          this.router.navigate(['/rooms', roomId]);
        }
      });

    this.socketService
      .listen<{ roomId: string }>(SOCKET_EVENTS.ROOM_REJECTED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ roomId }) => {
        if (roomId === this.roomId) {
          this.rejected = true;
        }
      });
  }
}
