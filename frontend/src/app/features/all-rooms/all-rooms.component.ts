import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { RoomService } from '../../core/services/room.service';
import { AuthService } from '../../core/services/auth.service';
import { Room } from '../../core/models/room.model';
import { io, Socket } from 'socket.io-client';

import { RoomCardComponent } from './../../shared/components/room-card/room-card.component';
import { NavbarComponent } from './../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

type FilterTab = 'all' | 'my' | 'public' | 'private';
type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-all-rooms',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    RoomCardComponent,
    NavbarComponent,
    FooterComponent
  ],
  templateUrl: './all-rooms.component.html',
  styleUrls: ['./all-rooms.component.scss'],
})
export class AllRoomsComponent implements OnInit, OnDestroy {
  private roomService = inject(RoomService);
  private authService = inject(AuthService);
  private router = inject(Router);

  rooms: Room[] = [];
  loading = true;

  // Search & Filter state
  searchQuery = '';
  activeFilter: FilterTab = 'all';
  viewMode: ViewMode = 'grid';

  // Pagination state from API
  currentPage = 1;
  pageSize = 9;
  totalPages = 1;
  totalResults = 0;
  hasNext = false;
  hasPrev = false;

  private socket: Socket;
  private subscriptions = new Subscription();
  private searchSubject = new Subject<string>();
  private currentUserId?: string;

  constructor() {
    this.socket = io({ transports: ['websocket', 'polling'] });
  }

  ngOnInit(): void {
    // 1. Get Logged-in User
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        this.currentUserId = user?._id;
        this.fetchRooms(); // Initial fetch
      })
    );

    // 2. Debounce Search Input
    this.subscriptions.add(
      this.searchSubject.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ).subscribe(() => {
        this.currentPage = 1;
        this.fetchRooms();
      })
    );

    // 3. Listen to global socket approvals
    this.socket.on('room:approved', (data: { roomId: string }) => {
      this.router.navigate(['/rooms', data.roomId]);
    });
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
    this.subscriptions.unsubscribe();
  }

  fetchRooms(): void {
    this.loading = true;
    this.roomService
      .getRooms(
        this.currentPage,
        this.pageSize,
        this.searchQuery.trim(),
        this.activeFilter,
        this.currentUserId
      )
      .subscribe({
        next: (res) => {
          this.rooms = res.data.rooms;
          this.totalPages = res.totalPages || 1;
          this.currentPage = res.page || 1;
          this.totalResults = res.totalResults || 0;
          this.hasNext = res.hasNext || false;
          this.hasPrev = res.hasPrev || false;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load rooms:', err);
          this.loading = false;
        }
      });
  }

  setFilter(filter: FilterTab): void {
    if (this.activeFilter === filter) return;
    this.activeFilter = filter;
    this.currentPage = 1;
    this.fetchRooms();
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchRooms();
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Action listeners from RoomCardComponent
  onJoinRoom(room: Room): void {
    this.router.navigate(['/rooms/join'], {
      queryParams: { room: room._id }
    });
  }

  onViewRoom(room: Room): void {
    this.router.navigate(['/rooms', room._id]);
  }

  onRequestInvite(room: Room): void {
    this.router.navigate(['/request-sent']);
  }

  onCreateRoom(): void {
    this.router.navigate(['/rooms/create']);
  }
}