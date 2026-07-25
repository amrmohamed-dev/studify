import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RoomMember {
  _id: string;
  name: string;
  email?: string;
  image?: { url: string | null };
}

export interface Room {
  _id: string;
  name: string;
  createdBy: {
    _id: string;
    name: string;
    image?: { url: string | null };
  };
  privacyType: string;
  maxMembers: number;
  members: {
    _id: string;
    user: RoomMember;
    joinedAt: string;
  }[];
  pendingMembers: any[];
}

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly API = `${environment.apiUrl}/rooms`;

  constructor(private http: HttpClient) {}

  getRoom(roomId: string): Observable<Room> {
    return this.http
      .get<{ status: string; data: { room: Room } }>(`${this.API}/${roomId}`)
      .pipe(map((res) => res.data.room));
  }

  getRoomMembers(roomId: string): Observable<RoomMember[]> {
    return this.http
      .get<{
        status: string;
        data: {
          owner: RoomMember;
          members: { _id: string; user: RoomMember; joinedAt: string }[];
        };
      }>(`${this.API}/${roomId}/members`)
      .pipe(
        map((res) => [res.data.owner, ...res.data.members.map((m) => m.user)])
      );
  }

  getPendingMembers(roomId: string): Observable<RoomMember[]> {
    return this.http
      .get<{ status: string; data: { pendingMembers: { user: RoomMember }[] } }>(
        `${this.API}/${roomId}/pending`
      )
      .pipe(map((res) => res.data.pendingMembers.map((m) => m.user)));
  }

  kickMember(roomId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${roomId}/members/${userId}`);
  }

  approveMember(roomId: string, userId: string): Observable<void> {
    return this.http.patch<void>(`${this.API}/${roomId}/members/${userId}/approve`, {});
  }

  rejectMember(roomId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${roomId}/pending/${userId}`);
  }

  leaveRoom(roomId: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${roomId}/members/me`);
  }

  getRooms(params?: { page?: number; limit?: number; search?: string }): Observable<any> {
    return this.http.get<any>(this.API, { params: params as any });
  }

  getRoomById(roomId: string): Observable<any> {
    return this.http.get<any>(`${this.API}/${roomId}`);
  }

  updateRoom(roomId: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.API}/${roomId}`, data);
  }

  joinRoom(roomId: string): Observable<any> {
    return this.http.post<any>(`${this.API}/${roomId}/join`, {});
  }

  createRoom(data: {
    name: string;
    privacyType: 'public' | 'private_request' | 'private_password';
    password?: string;
    maxMembers?: number;
    image?: File;
  }): Observable<{ status: string; data: { room: Room } }> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('privacyType', data.privacyType);
    if (data.privacyType === 'private_password' && data.password) {
      formData.append('password', data.password);
    }
    if (data.maxMembers) {
      formData.append('maxMembers', String(data.maxMembers));
    }
    if (data.image) {
      formData.append('image', data.image);
    }
    return this.http.post<{ status: string; data: { room: Room } }>(
      this.API,
      formData,
    );
  }
}
