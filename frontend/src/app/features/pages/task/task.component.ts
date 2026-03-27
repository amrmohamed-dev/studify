import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss'],
})
export class TaskComponent implements OnInit {
  @Input() roomId: string = "69c2897795a417877ea5988f";
  @Input() userId: string = "69c252e40612a88f47ea9339";

  tasks: any[] = [];
  newTaskTitle = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks() {
    this.http
      .get<any>(`/api/v1/rooms/${this.roomId}/tasks`)
      .subscribe({
        next: (res) => this.tasks = res.data?.tasks || [],
        error: (err) => console.error('Load tasks error:', err)
      });
  }

  addTask() {
    if (!this.newTaskTitle.trim()) return;

    const payload = {
      title: this.newTaskTitle,
      room: this.roomId,        // لازم يبقى موجود
      createdBy: this.userId,   // لازم يبقى موجود
    };

    this.http
      .post<any>(`/api/v1/rooms/${this.roomId}/tasks`, payload)
      .subscribe({
        next: (res) => {
          this.tasks.push(res.data.task);
          this.newTaskTitle = '';
        },
        error: (err) => console.error('Add task error:', err)
      });
  }

  toggleTask(task: any) {
    this.http
      .patch<any>(`/api/v1/tasks/${task._id}/toggle`, {})
      .subscribe({
        next: (res) => {
          const index = this.tasks.findIndex((t) => t._id === task._id);
          if (index !== -1) this.tasks[index] = res.data.task;
        },
        error: (err) => console.error('Toggle task error:', err)
      });
  }

  updateTask(taskId: string, newTitle: string) {
    this.http
      .put<any>(`/api/v1/tasks/${taskId}`, { title: newTitle })
      .subscribe({
        next: (res) => {
          const index = this.tasks.findIndex((t) => t._id === taskId);
          if (index !== -1) this.tasks[index] = res.data.task;
        },
        error: (err) => console.error('Update task error:', err)
      });
  }

  deleteTask(taskId: string) {
    this.http
      .delete(`/api/v1/tasks/${taskId}`)
      .subscribe({
        next: () => this.tasks = this.tasks.filter((t) => t._id !== taskId),
        error: (err) => console.error('Delete task error:', err)
      });
  }

  isDone(task: any): boolean {
    return task.doneBy?.some(
      (d: any) => d.user?._id === this.userId || d.user === this.userId
    );
  }
}