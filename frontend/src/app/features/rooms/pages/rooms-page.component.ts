import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RoomService } from '../../../core/services/room.service';
import { Room } from '../../../core/models/room.model';
import { RoomCardComponent } from '../../../shared/components/room-card/room-card.component';
import { StateCardComponent } from '../../../shared/ui/state-card/state-card.component';

type FilterTab = 'all' | 'my' | 'public' | 'private_request' | 'private_password';

@Component({
  selector: 'app-rooms-page',
  standalone: true,
  imports: [FormsModule, RouterLink, RoomCardComponent, StateCardComponent],
  templateUrl: './rooms-page.component.html',
  styleUrl: './rooms-page.component.scss',
})
export class RoomsPageComponent {
  private readonly roomService = inject(RoomService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchSubject = new Subject<string>();

  rooms: Room[] = [];
  currentUserId: string | null = null;

  searchQuery = '';
  activeFilter: any = 'all';

  loading = true;
  errorMessage = '';

  page = 1;
  totalPages = 1;
  totalResults = 0;
  hasNext = false;
  hasPrev = false;

  constructor() {
    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUserId = user?._id ?? null;
        this.fetchRooms();
      });

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.page = 1;
        this.fetchRooms();
      });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  setFilter(filter: FilterTab): void {
    if (this.activeFilter === filter) {
      return;
    }

    this.activeFilter = filter;
    this.page = 1;
    this.fetchRooms();
  }

  previousPage(): void {
    if (!this.hasPrev) {
      return;
    }

    this.page -= 1;
    this.fetchRooms();
  }

  nextPage(): void {
    if (!this.hasNext) {
      return;
    }

    this.page += 1;
    this.fetchRooms();
  }

  openJoin(room: Room): void {
    this.router.navigate(['/rooms/join'], {
      queryParams: { room: room._id },
    });
  }

  openRoom(room: Room): void {
    this.router.navigate(['/rooms', room._id]);
  }

  refresh(): void {
    this.fetchRooms();
  }

  trackRoom(_: number, room: Room): string {
    return room._id;
  }

  private fetchRooms(): void {
    this.loading = true;
    this.errorMessage = '';

    this.roomService
      .getRooms(
        this.page,
        9,
        this.searchQuery,
        this.activeFilter,
        this.currentUserId ?? undefined,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.rooms = result.items;
          this.page = result.meta.page;
          this.totalPages = result.meta.totalPages;
          this.totalResults = result.meta.total;
          this.hasNext = result.meta.hasNext;
          this.hasPrev = result.meta.hasPrev;
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message || 'We could not load rooms right now.';
        },
      });
  }
}
