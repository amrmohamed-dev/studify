import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomView } from '../../../core/models/room.model';

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-card.component.html',
  styleUrls: ['./room-card.component.scss']
})
export class RoomCardComponent {
  @Input() room!: RoomView;

  @Output() joinRoom = new EventEmitter<RoomView>();
  @Output() viewRoom = new EventEmitter<RoomView>();
  @Output() requestInvite = new EventEmitter<RoomView>();
  @Output() toggleBookmark = new EventEmitter<RoomView>();

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
