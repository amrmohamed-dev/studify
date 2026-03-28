import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Room } from '../../../core/models/room.model';

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-card.component.html',
  styleUrls: ['./room-card.component.scss'],
})
export class RoomCardComponent {
  @Input() room!: Room;
  @Input() currentUserId: string | null = null;

  @Output() joinRoom = new EventEmitter<Room>();
  @Output() viewRoom = new EventEmitter<Room>();
  @Output() requestInvite = new EventEmitter<Room>();

  onPrimaryAction(): void {
    if (this.isJoined) {
      this.viewRoom.emit(this.room);
      return;
    }

    if (this.room.privacyType === 'private_request') {
      this.requestInvite.emit(this.room);
      return;
    }

    this.joinRoom.emit(this.room);
  }

  get isJoined(): boolean {
    const userId = this.currentUserId;

    if (!userId) {
      return false;
    }

    if (this.room.createdBy._id === userId) {
      return true;
    }

    return this.room.members.some((member) => member.user._id === userId);
  }

  get privacyLabel(): string {
    switch (this.room.privacyType) {
      case 'private_request':
        return 'Approval required';
      case 'private_password':
        return 'Password protected';
      default:
        return 'Open room';
    }
  }

  get actionLabel(): string {
    if (this.isJoined) {
      return 'Open room';
    }

    if (this.room.privacyType === 'private_request') {
      return 'Request access';
    }

    if (this.room.privacyType === 'private_password') {
      return 'Join with password';
    }

    return 'Join room';
  }

  get memberCount(): number {
    const count = this.room.membersCount ?? this.room.members.length + 1;
    return Math.max(count, 1);
  }
}
