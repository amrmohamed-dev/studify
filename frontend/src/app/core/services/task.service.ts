import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RoomTask } from '../../shared/models/room.models';

interface TaskResponse {
  status: string;
  data: {
    task: RoomTask;
  };
}

interface TaskListResponse {
  status: string;
  data: {
    tasks: RoomTask[];
  };
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);

  getRoomTasks(roomId: string): Observable<RoomTask[]> {
    return this.http.get<TaskListResponse>(`/api/v1/rooms/${roomId}/tasks`).pipe(
      map((response) => response.data.tasks),
    );
  }

  createTask(roomId: string, title: string): Observable<RoomTask> {
    return this.http
      .post<TaskResponse>(`/api/v1/rooms/${roomId}/tasks`, { title })
      .pipe(map((response) => response.data.task));
  }

  updateTask(taskId: string, title: string): Observable<RoomTask> {
    return this.http
      .patch<TaskResponse>(`/api/v1/tasks/${taskId}`, { title })
      .pipe(map((response) => response.data.task));
  }

  toggleTask(taskId: string): Observable<RoomTask> {
    return this.http
      .patch<TaskResponse>(`/api/v1/tasks/${taskId}/toggle`, {})
      .pipe(map((response) => response.data.task));
  }

  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/tasks/${taskId}`);
  }
}
