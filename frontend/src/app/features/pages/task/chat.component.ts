import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
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
export class ChatComponent implements OnInit, AfterViewInit {
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

  initChat() {
    this.socketService.joinRoom(this.roomId);

    this.http
      .get<any>(`/api/v1/rooms/${this.roomId}/messages`)
      .subscribe((res) => {
        this.messages = (res.data.messages || []);
      });

    this.socketService.getMessages((msg: any) => {
      if (msg.room === this.roomId) {
        this.messages.push(msg);
        this.scrollToBottom();
      }
    });
  }

  send() {
    if (!this.message.trim()) return;

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
