import { NavbarComponent } from './../../shared/components/navbar/navbar.component';
import { RoomCardComponent } from './../../shared/components/room-card/room-card.component';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoomService } from '../../core/services/room.service';
import { Room, RoomView, toRoomView } from '../../core/models/room.model';
import { AuthService } from '../../core/services/auth.service';

import { FooterComponent } from '../../shared/components/footer/footer.component';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

type FilterTab = 'all' | 'my' | 'public' | 'private' | 'favourites';
type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-all-rooms',
  standalone: true,
  imports: [
    CommonModule,
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
  allRooms: RoomView[] = [];
  filteredRooms: RoomView[] = [];

  searchQuery = '';
  activeFilter: FilterTab = 'all';
  viewMode: ViewMode = 'grid';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];

  private socket: Socket;
  private socketSub?: Subscription;

  constructor(
    private roomService: RoomService,
    private router: Router,
    private authService: AuthService,
  ) {
    this.socket = io(environment.socketUrl);
  }

  ngOnInit(): void {
    this.fetchRooms();
    this.listenToSocket();
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
    this.socketSub?.unsubscribe();
  }

  private fetchRooms(): void {
    this.roomService.getRooms({ page: this.currentPage, limit: this.pageSize, search: this.searchQuery }).subscribe(res => {
      const rooms: Room[] = res.data.rooms;
      const currentUserId = this.authService.getCurrentUserId();
      this.allRooms = rooms.map(room => toRoomView(room, currentUserId));
      this.applyFilter();
      this.calculatePagination();
    });
  }

  private listenToSocket(): void {
    this.socket.on('room:approved', (data: { roomId: string }) => {
      this.router.navigate(['/rooms', data.roomId]);
    });
  }

  setFilter(filter: FilterTab): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.fetchRooms();
  }

  private applyFilter(): void {
    let rooms = [...this.allRooms];

    switch (this.activeFilter) {
      case 'public':
        rooms = rooms.filter(r => r.status === 'public');
        break;
      case 'private':
        rooms = rooms.filter(r => r.status === 'private');
        break;
      case 'my':
        rooms = rooms.filter(r => r.isJoined);
        break;
      case 'favourites':
        rooms = rooms.filter(r => r.isFavourite);
        break;
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      rooms = rooms.filter(r => r.name.toLowerCase().includes(q));
    }

    this.filteredRooms = rooms;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchRooms();
    }
  }

  private calculatePagination(): void {
    this.totalPages = Math.ceil(this.allRooms.length / this.pageSize);
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

onJoinRoom(room: RoomView): void {
  this.router.navigate(['/rooms/join'], {
    queryParams: { room: room._id }
  });
}

  onViewRoom(room: RoomView): void {
    this.router.navigate(['/rooms', room._id]);
  }

  onRequestInvite(room: RoomView): void {
    this.router.navigate(['/request-sent']);
  }

  onToggleBookmark(room: RoomView): void {
    room.isFavourite = !room.isFavourite;
  }

  onCreateRoom(): void {
    this.router.navigate(['/rooms/create']);
  }
}
