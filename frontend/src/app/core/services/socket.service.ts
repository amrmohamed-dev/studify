import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environment';
import {
  SOCKET_EVENTS,
  SocketAppError,
  SocketEventName,
} from '../../shared/models/socket-events';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private connectionBound = false;

  private readonly connectedSubject = new BehaviorSubject(false);
  private readonly errorSubject = new Subject<SocketAppError>();

  readonly connected$ = this.connectedSubject.asObservable();
  readonly errors$ = this.errorSubject.asObservable();

  connect(): void {
    const socket = this.ensureSocket();

    if (!socket.connected) {
      socket.connect();
    }
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.socket.disconnect();
    this.connectedSubject.next(false);
  }

  emit<TPayload>(event: SocketEventName | string, payload?: TPayload): void {
    const socket = this.ensureSocket();
    this.connect();
    socket.emit(event, payload);
  }

  listen<TPayload>(
    event: SocketEventName | string,
  ): Observable<TPayload> {
    const socket = this.ensureSocket();
    this.connect();

    return new Observable<TPayload>((subscriber) => {
      const handler = (payload: TPayload) => subscriber.next(payload);

      socket.on(event, handler);

      return () => {
        socket.off(event, handler);
      };
    });
  }

  joinRoom(roomId: string): void {
    this.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId });
  }

  leaveRoom(roomId: string): void {
    this.emit(SOCKET_EVENTS.ROOM_LEAVE, { roomId });
  }

  sendMessage(payload: { roomId: string; content: string }): void {
    this.emit(SOCKET_EVENTS.ROOM_MESSAGE, payload);
  }

  onMemberJoined(callback: (data: any) => void): void {
    this.connect();
    this.ensureSocket().on(SOCKET_EVENTS.ROOM_MEMBER_JOINED, callback);
  }

  onMemberLeft(callback: (data: any) => void): void {
    this.connect();
    this.ensureSocket().on(SOCKET_EVENTS.ROOM_MEMBER_LEFT, callback);
  }

  onKicked(callback: (data: any) => void): void {
    this.connect();
    this.ensureSocket().on(SOCKET_EVENTS.ROOM_KICKED, callback);
  }

  getMessages(callback: (message: any) => void): void {
    this.connect();
    this.ensureSocket().on(SOCKET_EVENTS.ROOM_MESSAGE, callback);
  }

  removeMessagesListener(): void {
    this.socket?.removeAllListeners(SOCKET_EVENTS.ROOM_MESSAGE);
  }

  onError(): Observable<SocketAppError>;
  onError(callback: (error: any) => void): void;
  onError(callback?: (error: any) => void): Observable<SocketAppError> | void {
    if (!callback) {
      return this.errors$;
    }

    this.connect();
    this.ensureSocket().on(SOCKET_EVENTS.ERROR, callback);
  }

  removeListener(eventName: SocketEventName | string): void {
    this.socket?.removeAllListeners(eventName);
  }

  removeRoomListeners(): void {
    this.socket?.removeAllListeners(SOCKET_EVENTS.ROOM_MEMBER_JOINED);
    this.socket?.removeAllListeners(SOCKET_EVENTS.ROOM_MEMBER_LEFT);
    this.socket?.removeAllListeners(SOCKET_EVENTS.ROOM_KICKED);
    this.socket?.removeAllListeners(SOCKET_EVENTS.ROOM_UPDATED);
    this.socket?.removeAllListeners(SOCKET_EVENTS.ROOM_MESSAGE);
  }

  private ensureSocket(): Socket {
    if (!this.socket) {
      this.socket = io(environment.socketUrl, {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
    }

    if (!this.connectionBound) {
      this.bindConnectionLifecycle(this.socket);
      this.connectionBound = true;
    }

    return this.socket;
  }

  private bindConnectionLifecycle(socket: Socket): void {
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      this.connectedSubject.next(true);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      this.connectedSubject.next(false);
    });

    socket.on(SOCKET_EVENTS.ERROR, (error: SocketAppError) => {
      this.errorSubject.next(error);
    });

    socket.on('connect_error', (error: Error) => {
      this.connectedSubject.next(false);
      this.errorSubject.next({
        message: error.message || 'Socket connection failed.',
      });
    });
  }
}
