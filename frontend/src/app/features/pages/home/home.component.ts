import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RoomService } from '../../../core/services/room.service';
import { Room } from '../../../core/models/room.model';
import { HomeService, SessionStats, TaskStats } from './home.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly homeService = inject(HomeService);
  private readonly authService = inject(AuthService);
  private readonly roomService = inject(RoomService);
  private readonly router = inject(Router);

  taskStats: TaskStats | null = null;
  sessionStats: SessionStats | null = null;

  myRooms: Room[] = [];
  suggestedRooms: Room[] = [];

  loadingMyRooms = true;
  loadingSuggestedRooms = true;

  private readonly subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        const userId = user?._id;

        if (userId) {
          this.loadStats();
          this.loadMyRooms(userId);
        } else {
          this.taskStats = null;
          this.sessionStats = null;
          this.myRooms = [];
          this.loadingMyRooms = false;
        }

        this.loadSuggestedRooms();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  goToRooms(): void {
    this.router.navigate(['/rooms']);
  }

  goToJoinRoom(): void {
    this.router.navigate(['/rooms/join']);
  }

  enterRoom(roomId: string): void {
    this.router.navigate(['/rooms', roomId]);
  }

  get sessionHoursDisplay(): string {
    if (!this.sessionStats) {
      return '--';
    }

    const hours = this.sessionStats.totalHours;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(2)}h`;
  }

  get sessionTrendLabel(): string {
    if (!this.sessionStats) {
      return 'Weekly progress will appear here.';
    }

    const change = this.sessionStats.percentageChange;

    if (change === 0) {
      return 'No change compared with last week.';
    }

    const direction = change > 0 ? 'up' : 'down';
    return `${Math.abs(change).toFixed(2)}% ${direction} from last week.`;
  }

  private loadStats(): void {
    this.homeService.getTaskStats().subscribe({
      next: (data) => {
        this.taskStats = data;
      },
      error: (err) => {
        console.error('Task stats error:', err);
        this.taskStats = null;
      },
    });

    this.homeService.getSessionStats().subscribe({
      next: (data) => {
        this.sessionStats = data;
      },
      error: (err) => {
        console.error('Session stats error:', err);
        this.sessionStats = null;
      },
    });
  }

  private loadMyRooms(userId: string): void {
    this.loadingMyRooms = true;

    this.roomService.getRooms(1, 6, '', 'my', userId).subscribe({
      next: (result) => {
        this.myRooms = result.items;
        this.loadingMyRooms = false;
      },
      error: (err) => {
        console.error('My Rooms error:', err);
        this.myRooms = [];
        this.loadingMyRooms = false;
      },
    });
  }

  private loadSuggestedRooms(): void {
    this.loadingSuggestedRooms = true;

    this.roomService.getRooms(1, 6, '', 'public').subscribe({
      next: (result) => {
        this.suggestedRooms = result.items;
        this.loadingSuggestedRooms = false;
      },
      error: (err) => {
        console.error('Suggested Rooms error:', err);
        this.suggestedRooms = [];
        this.loadingSuggestedRooms = false;
      },
    });
  }
}
