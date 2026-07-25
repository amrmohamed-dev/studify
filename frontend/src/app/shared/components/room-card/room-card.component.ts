import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '../../../core/models/room.model';

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-card.component.html',
  styleUrls: ['./room-card.component.scss']
})
export class RoomCardComponent {
  @Input() room!: Room;

  // Outputs لكل الأحداث اللي parent هيستقبلها
  @Output() joinRoom = new EventEmitter<Room>();
  @Output() viewRoom = new EventEmitter<Room>();
  @Output() requestInvite = new EventEmitter<Room>();
  @Output() toggleBookmark = new EventEmitter<Room>();

  // Methods لإطلاق الـ events
  onJoinRoom() {
    this.joinRoom.emit(this.room);
  }

  onViewRoom() {
    this.viewRoom.emit(this.room);
  }

  onRequestInvite() {
    this.requestInvite.emit(this.room);
  }

  onToggleBookmark() {
    this.toggleBookmark.emit(this.room);
  }
}