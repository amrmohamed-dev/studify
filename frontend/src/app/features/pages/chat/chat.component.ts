import {
  AfterViewChecked,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService } from '../../../core/services/socket.service';
import { ChatMessage } from '../../../shared/models/room.models';
import { SOCKET_EVENTS } from '../../../shared/models/socket-events';

interface MessagesResponse {
  status: string;
  data: {
    messages: ChatMessage[];
  };
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements AfterViewChecked {
  private readonly http = inject(HttpClient);
  private readonly socketService = inject(SocketService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) roomId = '';
  @Input({ required: true }) userId = '';

  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;

  messages: ChatMessage[] = [];
  draft = '';
  loading = true;
  sending = false;
  errorMessage = '';

  private shouldStickToBottom = true;

  ngOnInit(): void {
    this.loadMessages();

    this.socketService
      .listen<ChatMessage>(SOCKET_EVENTS.ROOM_MESSAGE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        const roomId =
          typeof message.room === 'string' ? message.room : message.room?._id;

        if (roomId !== this.roomId) {
          return;
        }

        const tempIndex = this.messages.findIndex(
          (item) =>
            item._tempId &&
            item.sender._id === message.sender._id &&
            item.content === message.content,
        );

        if (tempIndex === -1) {
          this.messages = [...this.messages, message];
        } else {
          const next = [...this.messages];
          next[tempIndex] = message;
          this.messages = next;
        }

        this.shouldStickToBottom = true;
      });
  }

  ngAfterViewChecked(): void {
    if (!this.shouldStickToBottom) {
      return;
    }

    const container = this.messagesContainer?.nativeElement;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
    this.shouldStickToBottom = false;
  }

  send(): void {
    const content = this.draft.trim();

    if (!content || this.sending) {
      return;
    }

    const optimisticMessage: ChatMessage = {
      _tempId: `temp-${Date.now()}`,
      room: this.roomId,
      sender: {
        _id: this.userId,
        name: 'You',
      },
      content,
      createdAt: new Date().toISOString(),
    };

    this.messages = [...this.messages, optimisticMessage];
    this.draft = '';
    this.sending = true;
    this.shouldStickToBottom = true;

    this.socketService.sendMessage({
      roomId: this.roomId,
      content,
    });

    queueMicrotask(() => {
      this.sending = false;
    });
  }

  isMine(message: ChatMessage): boolean {
    return message.sender._id === this.userId;
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  senderInitial(message: ChatMessage): string {
    return (message.sender.name || '?').charAt(0).toUpperCase();
  }

  private loadMessages(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http
      .get<MessagesResponse>(`/api/v1/rooms/${this.roomId}/messages`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.messages = response.data.messages.reverse();
          this.loading = false;
          this.shouldStickToBottom = true;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message || 'Chat history could not be loaded.';
        },
      });
  }
}
