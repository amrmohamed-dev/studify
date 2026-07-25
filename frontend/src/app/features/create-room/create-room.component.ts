import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RoomService } from '../../core/services/room.service';

@Component({
  selector: 'app-create-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-room.component.html',
  styleUrls: ['./create-room.component.scss'],
})
export class CreateRoomComponent {
  private fb = inject(FormBuilder);
  private roomService = inject(RoomService);
  private router = inject(Router);

  loading = false;
  error = '';
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  createRoomForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    privacyType: ['public', [Validators.required]],
    password: [''],
    maxMembers: [5, [Validators.required, Validators.min(1), Validators.max(11)]],
  });

  get isPasswordRoom(): boolean {
    return this.createRoomForm.get('privacyType')?.value === 'private_password';
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (this.createRoomForm.invalid) {
      this.createRoomForm.markAllAsTouched();
      return;
    }

    const formValue = this.createRoomForm.getRawValue();

    if (formValue.privacyType === 'private_password' && (!formValue.password || formValue.password.length < 6)) {
      this.error = 'Password must be at least 6 characters for a private room.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.roomService
      .createRoom({
        name: formValue.name,
        privacyType: formValue.privacyType as 'public' | 'private_request' | 'private_password',
        password: formValue.privacyType === 'private_password' ? formValue.password : undefined,
        maxMembers: formValue.maxMembers,
        image: this.selectedImage ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.router.navigate(['/rooms', res.data.room._id]);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Could not create the room. Please try again.';
        },
      });
  }
}
