import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface TaskStats {
  completedTasks: number;
}

export interface SessionStats {
  totalHours: number;
  percentageChange: number;
}

interface TaskStatsEntry {
  _id: string;
  completedTasks: number;
}

interface TaskStatsResponse {
  status: string;
  data: {
    completedTasks: TaskStatsEntry[];
  };
}

interface SessionStatsResponse {
  status: string;
  data: {
    stats: SessionStats;
  };
}

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  getTaskStats(): Observable<TaskStats> {
    return this.http
      .get<TaskStatsResponse>(`${this.baseUrl}/tasks/stats/me`)
      .pipe(
        map((response) => ({
          completedTasks: response.data.completedTasks.reduce(
            (total, entry) => total + (entry.completedTasks || 0),
            0,
          ),
        })),
      );
  }

  getSessionStats(): Observable<SessionStats> {
    return this.http
      .get<SessionStatsResponse>(`${this.baseUrl}/sessions/stats/me`)
      .pipe(
        map((response) => ({
          totalHours: response.data.stats.totalHours || 0,
          percentageChange: response.data.stats.percentageChange || 0,
        })),
      );
  }
}
