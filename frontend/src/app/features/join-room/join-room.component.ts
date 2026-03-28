import { Component, OnInit } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';


@Component({
  selector: 'app-join-room',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './join-room.component.html',
  styleUrls: ['./join-room.component.scss'],
})
export class JoinRoomComponent implements OnInit {
  joinForm!: FormGroup;
  isLoading = false;
  showAdminNotice = false;


  private adminApprovalRooms = ['ARCH-2024-STUDIO', 'CALC-PRIVATE-01'];

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.joinForm = this.fb.group({
      roomCode: ['', [Validators.required, Validators.minLength(3)]],
      password: [''],
    });

    this.joinForm.get('roomCode')!.valueChanges.subscribe((val: string) => {
      this.showAdminNotice = this.adminApprovalRooms.includes((val ?? '').toUpperCase());
    });
  }

  get roomCodeCtrl() { return this.joinForm.get('roomCode')!; }
  get passwordCtrl() { return this.joinForm.get('password')!; }

  onSubmit(): void {
    if (this.joinForm.invalid) {
      this.joinForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;

    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/request-sent']);
    }, 1000);
  }

  onRequestAccess(): void {
    this.router.navigate(['/request-sent']);
  }

  onCancel(): void {
    this.router.navigate(['/rooms']);
  }
}
