import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RoomService } from '../../core/services/room.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-create-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './create-room.component.html',
  styleUrls: ['./create-room.component.scss'],
})
export class CreateRoomComponent {
  form: FormGroup;
  isLoading = false;
  errorMessage = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      privacyType: ['public', Validators.required],
      password: [''],
      maxMembers: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    });

    this.form.get('privacyType')!.valueChanges.subscribe((type: string) => {
      const passwordCtrl = this.form.get('password')!;
      if (type === 'private_password') {
        passwordCtrl.setValidators([Validators.required, Validators.minLength(6)]);
      } else {
        passwordCtrl.clearValidators();
        passwordCtrl.setValue('');
      }
      passwordCtrl.updateValueAndValidity();
    });
  }

  get nameCtrl() { return this.form.get('name')!; }
  get passwordCtrl() { return this.form.get('password')!; }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => (this.imagePreview = reader.result as string);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('name', this.form.value.name);
    formData.append('privacyType', this.form.value.privacyType);
    formData.append('maxMembers', this.form.value.maxMembers);
    if (this.form.value.privacyType === 'private_password') {
      formData.append('password', this.form.value.password);
    }
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.roomService.createRoom(formData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.router.navigate(['/rooms', res.data.room._id]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'حصل خطأ، حاولي تاني.';
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/rooms']);
  }
}
