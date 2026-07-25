import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export interface SessionStats {
  totalHours: number;
  weeklyHours: number;
}

export interface Room {
  _id: string;
  name: string;
  image: {
    url: string | null;
    publicId: string | null;
  };
}

export interface RoomsResponse {
  data: {
    rooms: Room[];
  };
}

@Injectable({ providedIn: 'root' })
export class HomeService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  
  getTaskStats(): Observable<TaskStats> {
    return this.http.get<TaskStats>(`${this.baseUrl}/tasks/stats/me`);
  }

  getSessionStats(): Observable<SessionStats> {
    return this.http.get<SessionStats>(`${this.baseUrl}/sessions/stats/me`);
  }

  getMyRooms(userId: string): Observable<RoomsResponse> {
    return this.http.get<RoomsResponse>(
      `${this.baseUrl}/rooms?members=${userId}&limit=6`
    );
  }
}
