import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StateCardComponent } from '../../../shared/ui/state-card/state-card.component';
import { Room } from '../../../core/models/room.model';
import { RoomService } from '../../../core/services/room.service';

@Component({
  selector: 'app-join-room-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, StateCardComponent],
  templateUrl: './join-room-page.component.html',
  styleUrl: './join-room-page.component.scss',
})
export class JoinRoomPageComponent {
  private readonly fb = inject(FormBuilder);
  readonly roomService = inject(RoomService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  selectedRoom: Room | null = null;
  loadingRoom = false;
  submitting = false;
  roomError = '';
  submitError = '';

  readonly form = this.fb.group({
    roomId: ['', [Validators.required]],
    password: [''],
  });

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const roomId = params.get('room');

        if (!roomId) {
          this.selectedRoom = null;
          this.roomError = '';
          return;
        }

        this.form.patchValue({ roomId });
        this.loadRoom(roomId);
      });
  }

  get passwordRequired(): boolean {
    return this.selectedRoom?.privacyType === 'private_password';
  }

  get approvalRequired(): boolean {
    return this.selectedRoom?.privacyType === 'private_request';
  }

  previewRoom(): void {
    const roomId = this.form.controls.roomId.value?.trim();

    if (!roomId) {
      this.form.controls.roomId.markAsTouched();
      return;
    }

    this.loadRoom(roomId);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const roomId = this.form.controls.roomId.value?.trim() ?? '';

    if (!roomId) {
      this.form.controls.roomId.markAsTouched();
      return;
    }

    const password = this.form.controls.password.value?.trim() || undefined;

    this.submitting = true;
    this.submitError = '';

    this.roomService
      .joinRoom(roomId, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.submitting = false;

          if (result.room) {
            this.router.navigate(['/rooms', roomId]);
            return;
          }

          this.router.navigate(['/rooms/request-sent'], {
            queryParams: {
              room: roomId,
              name: this.selectedRoom?.name ?? '',
            },
          });
        },
        error: (error) => {
          this.submitting = false;

          if (error?.status === 409) {
            this.router.navigate(['/rooms', roomId]);
            return;
          }

          this.submitError =
            error?.error?.message || 'We could not complete the join request.';
        },
      });
  }

  private loadRoom(roomId: string): void {
    this.loadingRoom = true;
    this.roomError = '';

    this.roomService
      .getRoom(roomId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (room) => {
          this.selectedRoom = room;
          this.loadingRoom = false;
          this.form.patchValue({ password: '' });
        },
        error: (error) => {
          this.loadingRoom = false;
          this.selectedRoom = null;
          this.roomError =
            error?.error?.message || 'That room could not be found.';
        },
      });
  }
}
