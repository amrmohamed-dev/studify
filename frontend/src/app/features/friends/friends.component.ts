import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  FriendshipService,
  FriendEntry,
  PendingRequest,
} from '../../core/services/friendship.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { User } from '../../core/models/api.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

type FriendsTab = 'friends' | 'requests' | 'find';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
})
export class FriendsComponent implements OnInit, OnDestroy {
  activeTab: FriendsTab = 'friends';

  friends: FriendEntry[] = [];
  requests: PendingRequest[] = [];
  searchResults: User[] = [];

  searchQuery = '';
  private searchInput$ = new Subject<string>();

  loadingFriends = false;
  loadingRequests = false;
  loadingSearch = false;

  errorMessage = '';
  successMessage = '';

  sentRequestIds = new Set<string>();

  constructor(
    private friendshipService: FriendshipService,
    private authService: AuthService,
    private socketService: SocketService,
  ) {}

  ngOnInit(): void {
    this.fetchFriends();
    this.fetchRequests();

    this.searchInput$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((q) => this.runSearch(q));

    this.socketService.onFriendRequest(() => {
      this.fetchRequests();
    });

    this.socketService.onFriendAccepted(() => {
      this.fetchFriends();
    });
  }

  ngOnDestroy(): void {
    this.socketService.removeFriendshipListeners();
  }

  setTab(tab: FriendsTab): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  private fetchFriends(): void {
    this.loadingFriends = true;
    this.friendshipService.getFriends().subscribe({
      next: (res) => {
        this.friends = res.data?.friends ?? [];
        this.loadingFriends = false;
      },
      error: () => {
        this.loadingFriends = false;
      },
    });
  }

  private fetchRequests(): void {
    this.loadingRequests = true;
    this.friendshipService.getPendingRequests().subscribe({
      next: (res) => {
        this.requests = res.data?.requests ?? [];
        this.loadingRequests = false;
      },
      error: () => {
        this.loadingRequests = false;
      },
    });
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.searchInput$.next(value);
  }

  private runSearch(query: string): void {
    if (!query || !query.trim()) {
      this.searchResults = [];
      return;
    }

    this.loadingSearch = true;
    this.friendshipService.searchUsers(query.trim()).subscribe({
      next: (res) => {
        this.searchResults = (res.data as any)?.users ?? [];
        this.loadingSearch = false;
      },
      error: () => {
        this.loadingSearch = false;
      },
    });
  }

  sendRequest(user: User): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.friendshipService.sendFriendRequest(user._id).subscribe({
      next: () => {
        this.sentRequestIds.add(user._id);
        this.successMessage = `Friend request sent to ${user.name}.`;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message || 'Could not send friend request.';
      },
    });
  }

  acceptRequest(request: PendingRequest): void {
    this.friendshipService.acceptFriendRequest(request._id).subscribe({
      next: () => {
        this.requests = this.requests.filter((r) => r._id !== request._id);
        this.fetchFriends();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Could not accept request.';
      },
    });
  }

  rejectRequest(request: PendingRequest): void {
    this.friendshipService.rejectFriendRequest(request._id).subscribe({
      next: () => {
        this.requests = this.requests.filter((r) => r._id !== request._id);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Could not reject request.';
      },
    });
  }

  isAlreadySent(userId: string): boolean {
    return this.sentRequestIds.has(userId);
  }

  isAlreadyFriend(userId: string): boolean {
    return this.friends.some((f) => f.friend._id === userId);
  }

  getInitials(name?: string | null): string {
    return name
      ? name
          .split(' ')
          .slice(0, 2)
          .map((n) => n[0]?.toUpperCase())
          .join('')
      : '?';
  }
}
