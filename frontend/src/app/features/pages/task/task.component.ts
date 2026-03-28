import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService } from '../../../core/services/task.service';
import { SocketService } from '../../../core/services/socket.service';
import { RoomTask } from '../../../shared/models/room.models';
import { SOCKET_EVENTS } from '../../../shared/models/socket-events';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss',
})
export class TaskComponent {
  private readonly taskService = inject(TaskService);
  private readonly socketService = inject(SocketService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) roomId = '';
  @Input({ required: true }) userId = '';

  tasks: RoomTask[] = [];
  newTaskTitle = '';
  editingTaskId: string | null = null;
  editingTitle = '';

  loading = true;
  saving = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadTasks();

    this.socketService
      .listen<{ task: RoomTask }>(SOCKET_EVENTS.TASK_CREATED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ task }) => {
        if (task.room !== this.roomId) {
          return;
        }

        this.upsertTask(task);
      });

    this.socketService
      .listen<{
        task?: RoomTask;
        taskId?: string;
        roomId?: string;
        deleted?: boolean;
      }>(SOCKET_EVENTS.TASK_UPDATED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        if (payload.deleted && payload.roomId === this.roomId && payload.taskId) {
          this.tasks = this.tasks.filter((task) => task._id !== payload.taskId);
          return;
        }

        if (!payload.task || payload.task.room !== this.roomId) {
          return;
        }

        this.upsertTask(payload.task);
      });
  }

  addTask(): void {
    const title = this.newTaskTitle.trim();

    if (!title || this.saving) {
      return;
    }

    this.saving = true;
    this.taskService
      .createTask(this.roomId, title)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (task) => {
          this.upsertTask(task);
          this.newTaskTitle = '';
          this.saving = false;
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.message || 'We could not create that task.';
          this.saving = false;
        },
      });
  }

  toggleTask(task: RoomTask): void {
    this.taskService
      .toggleTask(task._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedTask) => {
          this.upsertTask(updatedTask);
        },
      });
  }

  startEditing(task: RoomTask): void {
    this.editingTaskId = task._id;
    this.editingTitle = task.title;
  }

  saveEditing(): void {
    if (!this.editingTaskId || !this.editingTitle.trim()) {
      return;
    }

    this.taskService
      .updateTask(this.editingTaskId, this.editingTitle.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedTask) => {
          this.upsertTask(updatedTask);
          this.editingTaskId = null;
          this.editingTitle = '';
        },
      });
  }

  deleteTask(taskId: string): void {
    this.taskService
      .deleteTask(taskId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.tasks = this.tasks.filter((task) => task._id !== taskId);
        },
      });
  }

  isDone(task: RoomTask): boolean {
    return (
      task.doneBy?.some((entry) =>
        typeof entry.user === 'string'
          ? entry.user === this.userId
          : entry.user._id === this.userId,
      ) ?? false
    );
  }

  private loadTasks(): void {
    this.loading = true;
    this.errorMessage = '';

    this.taskService
      .getRoomTasks(this.roomId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.tasks = tasks;
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message || 'We could not load tasks for this room.';
        },
      });
  }

  private upsertTask(task: RoomTask): void {
    const existingIndex = this.tasks.findIndex((item) => item._id === task._id);

    if (existingIndex === -1) {
      this.tasks = [task, ...this.tasks];
      return;
    }

    const next = [...this.tasks];
    next[existingIndex] = task;
    this.tasks = next;
  }
}
