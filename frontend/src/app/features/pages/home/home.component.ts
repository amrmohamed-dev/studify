import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HomeService, TaskStats, SessionStats, Room } from './home.service';
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private homeService = inject(HomeService);
  private authService = inject(AuthService);
  private router = inject(Router);

  taskStats: TaskStats | null = null;
  sessionStats: SessionStats | null = null;
  rooms: Room[] = [];
  loading = true;

  private mockRooms: Room[] = [
    { _id: '1', name: 'Advanced Quantum Theory', image: { url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=200&fit=crop', publicId: null } },
    { _id: '2', name: 'Ethics in AI Research', image: { url: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=200&fit=crop', publicId: null } },
    { _id: '3', name: 'Biology 101', image: { url: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=400&h=200&fit=crop', publicId: null } },
    { _id: '4', name: 'Math Analysis', image: { url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop', publicId: null } },
    { _id: '5', name: 'History of Science', image: { url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=200&fit=crop', publicId: null } },
    { _id: '6', name: 'Psychology Basics', image: { url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop', publicId: null } },
  ];

  ngOnInit(): void {
    const userId = this.authService['userSubject'].value?._id;

    this.homeService.getTaskStats().subscribe({
      next: (data: TaskStats) => this.taskStats = data,
      error: (err: any) => console.error('Task stats error:', err)
    });

    this.homeService.getSessionStats().subscribe({
      next: (data: SessionStats) => this.sessionStats = data,
      error: (err: any) => console.error('Session stats error:', err)
    });

    if (userId) {
      this.homeService.getMyRooms(userId).subscribe({
        next: (res: any) => {
          this.rooms = res.data.rooms;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Rooms error:', err);
          this.rooms = this.mockRooms;
          this.loading = false;
        }
      });
    } else {
      this.rooms = this.mockRooms;
      this.loading = false;
    }
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
}
