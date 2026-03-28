import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FriendService } from '../../../core/services/friend.service';
import { SocketService } from '../../../core/services/socket.service';
import { SOCKET_EVENTS } from '../../../shared/models/socket-events';
import {
  FriendRecord,
  PendingFriendRequest,
} from '../../../shared/models/friend.models';
import { UserPreview } from '../../../shared/models/room.models';
import { StateCardComponent } from '../../../shared/ui/state-card/state-card.component';

type FriendTab = 'friends' | 'requests' | 'users';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [StateCardComponent],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss',
})
export class FriendsComponent {
  private readonly friendService = inject(FriendService);
  private readonly socketService = inject(SocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  private readonly storageKey = 'pendingFriendRequests';

  activeTab: FriendTab = 'friends';
  pendingSent: string[] = this.readPendingFromStorage();

  friends: FriendRecord[] = [];
  requests: PendingFriendRequest[] = [];
  users: UserPreview[] = [];

  loading = true;

  constructor() {
    this.socketService.connect();
    this.bindQueryTab();
    this.bindRealtime();
    this.loadAll();
  }

  accept(id: string): void {
    this.friendService
      .accept(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.requests = this.requests.filter((request) => request._id !== id);
        },
      });
  }

  reject(id: string): void {
    this.friendService
      .reject(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.requests = this.requests.filter((request) => request._id !== id);
        },
      });
  }

  send(id: string): void {
    this.friendService
      .sendRequest(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (!this.pendingSent.includes(id)) {
            this.pendingSent = [...this.pendingSent, id];
            this.persistPending(this.pendingSent);
          }
        },
      });
  }

  isPending(userId: string): boolean {
    return this.pendingSent.includes(userId);
  }

  avatarLabel(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private loadAll(): void {
    this.loading = true;

    this.friendService
      .getFriends()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.friends = result.items;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });

    this.friendService
      .getRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (requests) => {
          this.requests = requests;
        },
      });

    this.friendService
      .getAllUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.users = result.items;
        },
      });
  }

  private bindQueryTab(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const tab = params.get('tab');

        if (tab === 'friends' || tab === 'requests' || tab === 'users') {
          this.activeTab = tab;
        }
      });
  }

  private bindRealtime(): void {
    this.socketService
      .listen<{ friendship: PendingFriendRequest }>(SOCKET_EVENTS.FRIEND_REQUEST)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ friendship }) => {
        this.requests = [friendship, ...this.requests];
      });

    this.socketService
      .listen<{ friendship: FriendRecord }>(SOCKET_EVENTS.FRIEND_ACCEPTED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ friendship }) => {
        this.friends = [friendship, ...this.friends];
        this.users = this.users.filter((user) => user._id !== friendship.friend._id);
      });
  }

  private readPendingFromStorage(): string[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]') as string[];
  }

  private persistPending(ids: string[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(ids));
  }
}
