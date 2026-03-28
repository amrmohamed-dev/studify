import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  ApiMeta,
  PaginatedResult,
  Room,
  RoomJoinResult,
  RoomPrivacy,
  UserPreview,
} from '../../shared/models/room.models';

type RoomsFilter = 'all' | 'my' | 'public' | 'private_request' | 'private_password';

interface RoomsResponse {
  status: string;
  meta: ApiMeta;
  data: {
    rooms: Room[];
  };
}

interface RoomsListResult extends PaginatedResult<Room> {
  data: {
    rooms: Room[];
  };
  page: number;
  totalPages: number;
  totalResults: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface RoomResponse {
  status: string;
  data: {
    room: Room;
  };
}

interface RoomMembersResponse {
  status: string;
  data: {
    owner: UserPreview;
    members: Array<{
      user: UserPreview;
      joinedAt?: string;
    }>;
  };
}

interface PendingMembersResponse {
  status: string;
  data: {
    pendingMembers: Array<{
      user: UserPreview;
      requestedAt?: string;
    }>;
  };
}

interface JoinRoomResponse {
  status: string;
  message: string;
  data: {
    room: Room | null;
  };
}

interface RoomMutationResponse {
  status: string;
  data: {
    room?: Room;
  };
}

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api/v1/rooms';

  getRooms(
    page = 1,
    limit = 12,
    search = '',
    filter: RoomsFilter = 'all',
    userId?: string,
  ): Observable<RoomsListResult> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (filter === 'public') {
      params = params.set('privacyType', 'public');
    }
    
    if (filter === 'private_request') {
      params = params.set('privacyType', 'private_request');
    }

    if (filter === 'private_password') {
      params = params.set('privacyType', 'private_password');
    }

    if (filter === 'my' && userId) {
      params = params.set('members.user', userId);
    }

    return this.http.get<RoomsResponse>(this.api, { params }).pipe(
      map((response) => ({
        items: response.data.rooms,
        meta: response.meta,
        data: {
          rooms: response.data.rooms,
        },
        page: response.meta.page,
        totalPages: response.meta.totalPages,
        totalResults: response.meta.total,
        hasNext: response.meta.hasNext,
        hasPrev: response.meta.hasPrev,
      })),
    );
  }

  getRoom(roomId: string): Observable<Room> {
    return this.http.get<RoomResponse>(`${this.api}/${roomId}`).pipe(
      map((response) => response.data.room),
    );
  }

  createRoom(data: FormData): Observable<Room | null> {
    return this.http
      .post<RoomMutationResponse>(this.api, data)
      .pipe(map((response) => response.data.room ?? null));
  }

  updateRoom(roomId: string, data: FormData): Observable<Room | null> {
    return this.http
      .patch<RoomMutationResponse>(`${this.api}/${roomId}`, data)
      .pipe(map((response) => response.data.room ?? null));
  }

  getRoomMembers(roomId: string): Observable<UserPreview[]> {
    return this.http
      .get<RoomMembersResponse>(`${this.api}/${roomId}/members`)
      .pipe(
        map((response) => [
          response.data.owner,
          ...response.data.members.map((member) => member.user),
        ]),
      );
  }

  getPendingMembers(roomId: string): Observable<UserPreview[]> {
    return this.http
      .get<PendingMembersResponse>(`${this.api}/${roomId}/pending`)
      .pipe(
        map((response) =>
          response.data.pendingMembers.map((member) => member.user),
        ),
      );
  }

  joinRoom(roomId: string, password?: string): Observable<RoomJoinResult> {
    return this.http
      .post<JoinRoomResponse>(`${this.api}/${roomId}/join`, {
        ...(password ? { password } : {}),
      })
      .pipe(
        map((response) => ({
          message: response.message,
          room: response.data.room,
        })),
      );
  }

  approveMember(roomId: string, userId: string): Observable<Room | null> {
    return this.http
      .patch<RoomMutationResponse>(
        `${this.api}/${roomId}/members/${userId}/approve`,
        {},
      )
      .pipe(map((response) => response.data.room ?? null));
  }

  rejectMember(roomId: string, userId: string): Observable<Room | null> {
    return this.http
      .patch<RoomMutationResponse>(
        `${this.api}/${roomId}/members/${userId}/reject`,
        {},
      )
      .pipe(map((response) => response.data.room ?? null));
  }

  removeMember(roomId: string, userId: string): Observable<Room | null> {
    return this.http
      .delete<RoomMutationResponse>(`${this.api}/${roomId}/members/${userId}`)
      .pipe(map((response) => response.data.room ?? null));
  }

  kickMember(roomId: string, userId: string): Observable<Room | null> {
    return this.removeMember(roomId, userId);
  }

  leaveRoom(roomId: string, userId?: string): Observable<Room | null> {
    return this.removeMember(roomId, userId ?? 'me');
  }

  isJoinedRoom(room: Room, userId: string | null | undefined): boolean {
    if (!userId) {
      return false;
    }

    if (room.createdBy._id === userId) {
      return true;
    }

    return room.members.some((member) => member.user._id === userId);
  }

  requiresPassword(room: Room): boolean {
    return room.privacyType === 'private_password';
  }

  requiresApproval(room: Room): boolean {
    return room.privacyType === 'private_request';
  }

  privacyLabel(privacyType: RoomPrivacy): string {
    switch (privacyType) {
      case 'private_request':
        return 'Approval required';
      case 'private_password':
        return 'Password protected';
      default:
        return 'Open room';
    }
  }
}
