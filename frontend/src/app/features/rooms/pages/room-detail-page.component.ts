import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RoomService } from '../../../core/services/room.service';
import { SocketService } from '../../../core/services/socket.service';
import { SessionService } from '../../../core/services/session.service';
import {
  Room,
  RoomKickedEvent,
  RoomJoinRequestEvent,
  RoomMemberEvent,
  RoomUpdatedEvent,
  SessionType,
  StudySession,
  UserPreview,
} from '../../../shared/models/room.models';
import { SOCKET_EVENTS } from '../../../shared/models/socket-events';
import { StateCardComponent } from '../../../shared/ui/state-card/state-card.component';
import { TaskComponent } from '../../pages/task/task.component';
import { ChatComponent } from '../../pages/chat/chat.component';

type BannerTone = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-room-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, StateCardComponent, TaskComponent, ChatComponent],
  templateUrl: './room-detail-page.component.html',
  styleUrl: './room-detail-page.component.scss',
})
export class RoomDetailPageComponent {
  private readonly authService = inject(AuthService);
  readonly roomService = inject(RoomService);
  private readonly socketService = inject(SocketService);
  private readonly sessionService = inject(SessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  roomId = '';
  room: Room | null = null;
  members: UserPreview[] = [];
  pendingMembers: UserPreview[] = [];

  currentUserId = '';
  currentUserName = '';

  loading = true;
  errorState: 'invalid' | 'unauthorized' | '' = '';
  errorMessage = '';

  banner: { tone: BannerTone; message: string } | null = null;
  activeSession: StudySession | null = null;
  sessionCountdown = '--:--';

  private bannerTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private hasSocketRoomAccess = false;

  readonly sessionPresets: Array<{
    label: string;
    type: SessionType;
    duration: number;
  }> = [
    { label: 'Focus 25', type: 'study', duration: 25 },
    { label: 'Deep 50', type: 'study', duration: 50 },
    { label: 'Break 10', type: 'break', duration: 10 },
  ];

  constructor() {
    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUserId = user?._id ?? '';
        this.currentUserName = user?.name ?? '';
      });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const nextRoomId = params.get('roomId');

        if (!nextRoomId) {
          this.router.navigate(['/rooms']);
          return;
        }

        if (this.roomId && this.hasSocketRoomAccess) {
          this.socketService.leaveRoom(this.roomId);
        }

        this.roomId = nextRoomId;
        this.room = null;
        this.members = [];
        this.pendingMembers = [];
        this.errorState = '';
        this.errorMessage = '';
        this.hasSocketRoomAccess = false;
        this.stopCountdown();
        this.loadRoomState();
      });

    this.socketService.connect();
    this.bindRealtime();
  }

  get isOwner(): boolean {
    return !!this.room && this.room.createdBy._id === this.currentUserId;
  }

  get sessionLabel(): string {
    if (!this.activeSession) {
      return 'No active session';
    }

    return this.activeSession.type === 'study' ? 'Study session' : 'Break session';
  }

  leaveRoom(): void {
    if (!this.currentUserId) {
      return;
    }

    this.roomService
      .leaveRoom(this.roomId, this.currentUserId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.socketService.leaveRoom(this.roomId);
          this.router.navigate(['/rooms']);
        },
        error: (error) => {
          this.showBanner(
            error?.error?.message || 'We could not leave the room cleanly.',
            'error',
          );
        },
      });
  }

  kickMember(userId: string): void {
    this.roomService
      .removeMember(this.roomId, userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.members = this.members.filter((member) => member._id !== userId);
          this.showBanner('Member removed from the room.', 'warning');
        },
      });
  }

  approveMember(userId: string): void {
    this.roomService
      .approveMember(this.roomId, userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const approved = this.pendingMembers.find((member) => member._id === userId);
          this.pendingMembers = this.pendingMembers.filter(
            (member) => member._id !== userId,
          );

          if (approved && !this.members.some((member) => member._id === userId)) {
            this.members = [...this.members, approved];
          }

          this.showBanner('Join request approved.', 'success');
        },
      });
  }

  rejectMember(userId: string): void {
    this.roomService
      .rejectMember(this.roomId, userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendingMembers = this.pendingMembers.filter(
            (member) => member._id !== userId,
          );
          this.showBanner('Join request rejected.', 'warning');
        },
      });
  }

  startSession(type: SessionType, duration: number): void {
    this.sessionService
      .startSession(this.roomId, type, duration)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          if (session) {
            this.applySession(session);
          }
        },
        error: (error) => {
          this.showBanner(
            error?.error?.message || 'We could not start the session.',
            'error',
          );
        },
      });
  }

  endSession(): void {
    if (!this.activeSession) {
      return;
    }

    this.sessionService
      .endSession(this.activeSession.sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.applySession(session);
        },
        error: (error) => {
          this.showBanner(
            error?.error?.message || 'We could not end the session.',
            'error',
          );
        },
      });
  }

  memberInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  ngOnDestroy(): void {
    if (this.roomId && this.hasSocketRoomAccess) {
      this.socketService.leaveRoom(this.roomId);
    }

    this.stopCountdown();
  }

  private bindRealtime(): void {
    this.socketService
      .listen<void>(SOCKET_EVENTS.CONNECT)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.roomId && this.hasSocketRoomAccess) {
          this.socketService.joinRoom(this.roomId);
        }
      });

    this.socketService
      .listen<RoomJoinRequestEvent>(SOCKET_EVENTS.ROOM_JOIN_REQUEST)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.roomId !== this.roomId || !this.isOwner) {
          return;
        }

        if (
          this.pendingMembers.some((member) => member._id === event.user._id) ||
          this.members.some((member) => member._id === event.user._id)
        ) {
          return;
        }

        this.pendingMembers = [event.user, ...this.pendingMembers];
        this.showBanner(`${event.user.name} requested to join the room.`, 'info');
      });

    this.socketService
      .listen<RoomMemberEvent>(SOCKET_EVENTS.ROOM_MEMBER_JOINED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.roomId !== this.roomId) {
          return;
        }

        if (!this.members.some((member) => member._id === event.user._id)) {
          this.members = [...this.members, event.user];
        }

        this.showBanner(`${event.user.name} joined the room.`, 'info');
      });

    this.socketService
      .listen<RoomMemberEvent>(SOCKET_EVENTS.ROOM_MEMBER_LEFT)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.roomId !== this.roomId) {
          return;
        }

        this.members = this.members.filter((member) => member._id !== event.user._id);
        this.showBanner(`${event.user.name} left the room.`, 'warning');
      });

    this.socketService
      .listen<RoomKickedEvent>(SOCKET_EVENTS.ROOM_KICKED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.roomId !== this.roomId) {
          return;
        }

        this.showBanner('You were removed from this room.', 'error');
        this.router.navigate(['/rooms']);
      });

    this.socketService
      .listen<RoomUpdatedEvent>(SOCKET_EVENTS.ROOM_UPDATED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.room._id !== this.roomId) {
          return;
        }

        this.room = event.room;
        this.showBanner('Room details were updated.', 'info');
      });

    this.socketService
      .listen<StudySession>(SOCKET_EVENTS.SESSION_STARTED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((session) => {
        if (session.roomId !== this.roomId) {
          return;
        }

        this.applySession(session);
        this.showBanner(
          session.type === 'study'
            ? 'A new study session has started.'
            : 'A break session has started.',
          'success',
        );
      });

    this.socketService
      .listen<StudySession>(SOCKET_EVENTS.SESSION_ENDED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((session) => {
        if (session.roomId !== this.roomId) {
          return;
        }

        if (this.activeSession?.sessionId === session.sessionId) {
          this.applySession(null);
        }

        this.showBanner('The current session has ended.', 'warning');
      });
  }

  private loadRoomState(): void {
    this.loading = true;

    this.roomService
      .getRoom(this.roomId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (room) => {
          this.room = room;
          this.loadMemberState();
        },
        error: (error) => {
          this.loading = false;
          this.errorState = 'invalid';
          this.errorMessage =
            error?.error?.message || 'That room does not exist anymore.';
        },
      });
  }

  private loadMemberState(): void {
    this.roomService
      .getRoomMembers(this.roomId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (members) => {
          this.members = members;
          this.loading = false;
          this.errorState = '';
          this.errorMessage = '';
          this.hasSocketRoomAccess = true;
          this.socketService.joinRoom(this.roomId);
          this.loadActiveSession();

          if (this.isOwner) {
            this.loadPendingMembers();
          }
        },
        error: (error) => {
          this.loading = false;
          this.hasSocketRoomAccess = false;

          if (error?.status === 403) {
            this.errorState = 'unauthorized';
            this.errorMessage =
              error?.error?.message || 'You do not have access to this room yet.';
            return;
          }

          this.errorState = 'invalid';
          this.errorMessage =
            error?.error?.message || 'We could not load room members.';
        },
      });
  }

  private loadPendingMembers(): void {
    this.roomService
      .getPendingMembers(this.roomId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pendingMembers) => {
          this.pendingMembers = pendingMembers;
        },
      });
  }

  private loadActiveSession(): void {
    this.sessionService
      .getActiveSession(this.roomId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.applySession(session);
        },
      });
  }

  private applySession(session: StudySession | null): void {
    this.activeSession = session;

    if (!session) {
      this.stopCountdown();
      this.sessionCountdown = '--:--';
      return;
    }

    this.startCountdown(session.endsAt);
  }

  private startCountdown(endsAt: string): void {
    this.stopCountdown();

    const update = () => {
      const difference = new Date(endsAt).getTime() - Date.now();

      if (difference <= 0) {
        this.sessionCountdown = '00:00';
        return;
      }

      const totalSeconds = Math.floor(difference / 1000);
      const minutes = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, '0');
      const seconds = (totalSeconds % 60).toString().padStart(2, '0');

      this.sessionCountdown = `${minutes}:${seconds}`;
    };

    update();
    this.countdownTimer = setInterval(update, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private showBanner(message: string, tone: BannerTone): void {
    this.banner = { tone, message };

    if (this.bannerTimer) {
      clearTimeout(this.bannerTimer);
    }

    this.bannerTimer = setTimeout(() => {
      this.banner = null;
    }, 3200);
  }
}
