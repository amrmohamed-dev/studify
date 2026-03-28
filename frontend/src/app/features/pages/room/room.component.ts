import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { ChatComponent } from '../chat/chat.component';
import { TaskComponent } from '../task/task.component';
import { AuthService } from '../../../core/services/auth.service';
import { RoomService } from '../../../core/services/room.service';
import { SocketService } from '../../../core/services/socket.service';
import { User } from '../../../core/models/room.model';
import { Location } from '@angular/common';

type SessionType = 'work' | 'short' | 'long';

const SESSION_DURATIONS: Record<SessionType, number> = {
  work:  25 * 60,
  short:  5 * 60,
  long:  15 * 60,
};

const SESSION_LABELS: Record<SessionType, string> = {
  work:  'DEEP WORK',
  short: 'SHORT BREAK',
  long:  'LONG BREAK',
};

export interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, ChatComponent, TaskComponent, TitleCasePipe],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent implements OnInit, OnDestroy {
  // ─── Core Services & State ────────────────────────────────────────────────
  user$!: Observable<any>;
  currentUserId = '';
  currentUserName = '';
  
  roomId = '';
  roomCreatedById = '';
  roomName = '';

  get isAdmin(): boolean {
    return !!this.currentUserId && this.currentUserId === this.roomCreatedById;
  }

  location = inject(Location);
  members: User[] = [];
  pendingMembers: User[] = [];
  
  membersLoading = true;
  membersError = false;
  showAllMembers = false;

  toasts: Toast[] = [];
  private toastCounter = 0;
  private subscriptions = new Subscription();
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  // ─── Timer State ────────────────────────────────────────────────────────
  sessionType: SessionType = 'work';
  timeLeft = SESSION_DURATIONS['work'];
  timerLabel = SESSION_LABELS['work'];
  isRunning = false;
  isPaused = false;
  
  readonly RADIUS = 72;
  readonly CIRCUMFERENCE = 2 * Math.PI * this.RADIUS;

  constructor(
    public auth: AuthService,
    private roomService: RoomService,
    private socketService: SocketService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.user$ = this.auth.user$;

    this.subscriptions.add(
      this.auth.user$.subscribe((user) => {
        if (user) {
          this.currentUserId = user._id;
          this.currentUserName = user.name ?? '';
        }
      })
    );

    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        const id = params.get('roomId');
        if (id) {
          this.roomId = id;
          this.loadRoomData();
          this.initSocketListeners();
        } else {
          this.navigateHome();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.socketService.removeRoomListeners();
    this.subscriptions.unsubscribe();
  }

  // ─── Data Loading ────────────────────────────────────────────────────────

  private loadRoomData(): void {
    this.membersLoading = true;
    this.membersError = false;

    // 1. Fetch Room Meta Data
    this.subscriptions.add(
      this.roomService.getRoom(this.roomId).subscribe({
        next: (room) => {
          this.roomCreatedById = room.createdBy._id;
          this.roomName = room.name;
        },
        error: () => this.handleAccessDenied() // if 403 or unavailable, fall to denied flow
      })
    );

    // 2. Fetch Members explicitly
    this.subscriptions.add(
      this.roomService.getRoomMembers(this.roomId).subscribe({
        next: (members) => {
          this.members = members;
          const isMember = this.members.some((m) => m._id === this.currentUserId);
          
          if (!isMember) {
            this.handleAccessDenied();
          } else {
            this.membersLoading = false;
            // Only admin needs to actively load pending members in layout
            if (this.isAdmin) this.loadPendingMembers();
          }
        },
        error: () => this.handleAccessDenied()
      })
    );
  }

  private loadPendingMembers(): void {
    this.subscriptions.add(
      this.roomService.getPendingMembers(this.roomId).subscribe({
        next: (pending) => (this.pendingMembers = pending),
        error: () => console.error('Could not load pending members'),
      })
    );
  }

  private handleAccessDenied(): void {
    // According to specs, if not member -> redirect to join flow securely
    this.showToast('Access Denied. You are not a member of this room.', 'error');
    setTimeout(() => {
      this.router.navigate(['/rooms/join'], { queryParams: { room: this.roomId } });
    }, 1500);
  }

  // ─── Sockets ──────────────────────────────────────────────────────────────

  private initSocketListeners(): void {
    // Clear previously lingering listeners cleanly
    this.socketService.removeRoomListeners();

    this.socketService.onMemberJoined((data: { user: User }) => {
      if (!this.members.find((m) => m._id === data.user._id)) {
        this.members = [...this.members, data.user];
        this.showToast(`${data.user.name} joined the room 👋`, 'info');
      }
    });

    this.socketService.onMemberLeft((data: { userId: string; name?: string }) => {
      const name = this.getMemberName(data.userId, data.name);
      this.removeMember(data.userId);

      if (data.userId === this.currentUserId) {
        this.showToast('You left the room', 'info');
        this.navigateHome();
      } else {
        this.showToast(`${name} left the room`, 'warning');
      }
    });

    this.socketService.onKicked((data: { userId: string; name?: string }) => {
      const name = this.getMemberName(data.userId, data.name);
      this.removeMember(data.userId);

      if (data.userId === this.currentUserId) {
        this.showToast('You were removed from the room', 'error');
        this.navigateHome(1500);
      } else {
        this.showToast(`${name} was removed from the room`, 'warning');
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  get visibleMembers(): User[] {
    return this.showAllMembers ? this.members : this.members.slice(0, 3);
  }

  toggleShowAllMembers(): void {
    this.showAllMembers = !this.showAllMembers;
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '?';
  }

  private getMemberName(userId: string, fallback?: string): string {
    return this.members.find((m) => m._id === userId)?.name ?? fallback ?? 'A member';
  }

  private removeMember(userId: string): void {
    this.members = this.members.filter((m) => m._id !== userId);
  }

  private removePending(userId: string): void {
    this.pendingMembers = this.pendingMembers.filter((m) => m._id !== userId);
  }

  private navigateHome(delay = 0): void {
    setTimeout(() => this.router.navigate(['/home']), delay);
  }

  showToast(message: string, type: Toast['type'] = 'info', duration = 3500): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, message, type });
    setTimeout(() => this.dismissToast(id), duration);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  // ─── API Commands ────────────────────────────────────────────────────────

  leaveRoom(): void {
    this.roomService.leaveRoom(this.roomId).subscribe({
      next: () => console.log('Leave requested successfully'),
      error: () => {
        this.showToast('Failed to leave the room properly', 'error');
        this.navigateHome();
      }
    });
  }

  kickMember(userId: string): void {
    if (!this.isAdmin || userId === this.roomCreatedById) return;
    this.roomService.kickMember(this.roomId, userId).subscribe({
      next: () => {
        const name = this.getMemberName(userId);
        this.removeMember(userId);
        this.showToast(`${name} was removed`, 'success');
      },
      error: () => this.showToast('Failed to remove member.', 'error'),
    });
  }

  approveMember(userId: string): void {
    if (!this.isAdmin) return;
    this.roomService.approveMember(this.roomId, userId).subscribe({
      next: () => {
        const approved = this.pendingMembers.find((m) => m._id === userId);
        this.removePending(userId);
        if (approved) {
          this.members = [...this.members, approved];
          this.showToast(`${approved.name} approved!`, 'success');
        }
      },
      error: () => this.showToast('Failed to approve member.', 'error'),
    });
  }

  rejectMember(userId: string): void {
    if (!this.isAdmin) return;
    this.roomService.rejectMember(this.roomId, userId).subscribe({
      next: () => {
        const rejected = this.pendingMembers.find((m) => m._id === userId);
        this.removePending(userId);
        if (rejected) {
          this.showToast(`${rejected.name}'s request rejected`, 'warning');
        }
      },
      error: () => this.showToast('Failed to reject member.', 'error'),
    });
  }

  // ─── Timer Logic ────────────────────────────────────────────────────────

  get ringOffset(): number {
    const total = SESSION_DURATIONS[this.sessionType];
    return this.CIRCUMFERENCE * (1 - this.timeLeft / total);
  }

  get formattedTime(): string {
    const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
    const s = (this.timeLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  toggleTimer(): void {
    this.isRunning ? this.pauseTimer() : this.startTimer();
  }

  startTimer(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.stopTimer();
      }
    }, 1000);
  }

  pauseTimer(): void {
    this.isRunning = false;
    this.isPaused = true;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  stopTimer(): void {
    this.isRunning = false;
    this.isPaused = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  resetTimer(): void {
    this.stopTimer();
    this.timeLeft = SESSION_DURATIONS[this.sessionType];
  }

  switchSession(type: SessionType): void {
    this.stopTimer();
    this.sessionType = type;
    this.timeLeft = SESSION_DURATIONS[type];
    this.timerLabel = SESSION_LABELS[type];
  }
}