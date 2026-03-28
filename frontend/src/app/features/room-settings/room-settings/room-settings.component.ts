import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';

interface RoomSettings {
  name: string;
  maxMembers: number;
  privacyType: 'public' | 'private_request' | 'private_password';
  password: string;
  image: string | null;
}

@Component({
  selector: 'app-room-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-settings.component.html',
  styleUrls: ['./room-settings.component.scss'],
})
export class RoomSettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private roomService = inject(RoomService);

  mode: 'create' | 'edit' = 'create';
  roomId: string = '';
  isLoading = false;
  isFetching = false;
  successMessage = '';
  errorMessage = '';
  previewImage: string | null = null;
  selectedFile: File | null = null;
  showPassword = false;

  settings: RoomSettings = {
    name: '',
    maxMembers: 5,
    privacyType: 'public',
    password: '',
    image: null,
  };

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'];

    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    if (this.roomId) {
      this.fetchRoom();
    }
  }

  fetchRoom(): void {
    this.isFetching = true;
    this.roomService.getRoom(this.roomId).subscribe({
      next: (res: any) => {
        const room = res;
        if (room) {
          this.settings.name = room.name || '';
          this.settings.maxMembers = room.maxMembers || 5;
          this.settings.privacyType = room.privacyType || 'public';
          this.previewImage = room.image?.url || null;
        }
        this.isFetching = false;
      },
      error: () => {
        this.isFetching = false;
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      this.errorMessage = '';

      const file = input.files[0];
      const maxSize = 7 * 1024 * 1024;

      if (file.size > maxSize) {
        this.errorMessage = 'Image must be less than 7MB';
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.previewImage = null;
    this.selectedFile = null;
  }

  onPrivacyChange(
    type: 'public' | 'private_request' | 'private_password',
  ): void {
    this.settings.privacyType = type;
    if (type !== 'private_password') {
      this.settings.password = '';
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.settings.name.trim()) {
      this.errorMessage = 'Room name is required.';
      return;
    }

    if (
      this.settings.privacyType === 'private_password' &&
      !this.settings.password
    ) {
      this.errorMessage = 'Password is required for password-protected rooms.';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('name', this.settings.name);
    formData.append('maxMembers', this.settings.maxMembers.toString());
    formData.append('privacyType', this.settings.privacyType);

    if (
      this.settings.privacyType === 'private_password' &&
      this.settings.password
    ) {
      formData.append('password', this.settings.password);
    }

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    if (this.mode === 'edit') {
      this.roomService.updateRoom(this.roomId, formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Room settings updated successfully!';
          setTimeout(() => (this.successMessage = ''), 3500);
        },
        error: (err: any) => {
          this.isLoading = false;
          this.errorMessage =
            err?.error?.message ||
            'Failed to update room settings. Please try again.';
        },
      });
    }

    if (this.mode === 'create') {
      this.roomService.createRoom(formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Room created successfully!';
          setTimeout(() => (this.successMessage = ''), 3500);
        },
        error: (err: any) => {
          this.isLoading = false;
          this.errorMessage =
            err?.error?.message || 'Failed to create room. Please try again.';
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/rooms', this.roomId]);
  }
}
