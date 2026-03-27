import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
  private readonly API = '/api/v1/rooms';

  constructor(private http: HttpClient) {}

  getRoom(roomId: string): Observable<Room> {
    return this.http
      .get<{ status: string; data: { room: Room } }>(`${this.API}/${roomId}`)
      .pipe(map((res) => res.data.room));
  }

  /** Returns owner + all members as a flat RoomMember array */
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

  /** Reject a pending join request */
  rejectMember(roomId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${roomId}/pending/${userId}`);
  }

  leaveRoom(roomId: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${roomId}/members/me`);
  }

  /** Checks whether the current user is a member of the given room */
  isMember(roomId: string): Observable<boolean> {
    return this.getRoomMembers(roomId).pipe(map(() => true));
  }
}