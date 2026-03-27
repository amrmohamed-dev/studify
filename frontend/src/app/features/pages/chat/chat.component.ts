import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../../core/services/socket.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() roomId!: string;
  @Input() userId!: string;

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages: any[] = [];
  message = '';

  constructor(private socketService: SocketService, private http: HttpClient) {}

  ngOnInit(): void {
    this.initChat();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.socketService.leaveRoom(this.roomId);
    this.socketService.removeMessagesListener();
  }

  initChat() {
    // 🔹 Join the room
    this.socketService.joinRoom(this.roomId);

    // 🔹 Load old messages
    this.http
      .get<any>(`/api/v1/rooms/${this.roomId}/messages`)
      .subscribe((res) => {
        this.messages = (res.data.messages || []).reverse();
        this.scrollToBottom();
      });

    // 🔹 Listen to incoming messages
    this.socketService.getMessages((msg: any) => {
      if (msg.room?.toString() === this.roomId) {
        // ✅ Replace optimistic message if it exists
        const tempIndex = this.messages.findIndex(
          (m) =>
            m._tempId &&
            m.sender._id?.toString() === this.userId?.toString() &&
            m.content === msg.content
        );

        if (tempIndex !== -1) {
          this.messages[tempIndex] = msg;
        } else {
          this.messages.push(msg);
        }

        this.scrollToBottom();
      }
    });

    this.socketService.onError((err) => {
      console.error('Socket error:', err);
    });
  }

  send() {
    if (!this.message.trim()) return;

    // 🔹 Optimistic message
    const tempMsg = {
      _tempId: `temp-${Date.now()}`,
      content: this.message,
      sender: { _id: this.userId },
      createdAt: new Date(),
      room: this.roomId,
    };

    this.messages.push(tempMsg);
    this.scrollToBottom();

    // 🔹 Send to server
    this.socketService.sendMessage({
      roomId: this.roomId,
      content: this.message,
    });

    this.message = '';
  }

  scrollToBottom() {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  isMe(msg: any): boolean {
    return msg?.sender?._id?.toString() === this.userId?.toString();
  }

  formatTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  getInitial(name: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1'];
    let index = name?.charCodeAt(0) % colors.length;
    return colors[index];
  }
}