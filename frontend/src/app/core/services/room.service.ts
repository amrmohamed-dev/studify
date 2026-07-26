import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Room, ApiResponse } from '../models/room.model';

export interface RoomMember {
  _id: string;
  name: string;
  email?: string;
  image?: { url: string | null };
}

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private baseUrl = environment.apiUrl + '/rooms';

  constructor(private http: HttpClient) {}

  getRooms(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: 'public' | 'private';
    favourites?: boolean;
  }): Observable<ApiResponse<Room[]>> {
    return this.http.get<ApiResponse<Room[]>>(this.baseUrl, {
      params: params as any,
    });
  }

  getRoom(roomId: string): Observable<Room> {
    return this.http
      .get<ApiResponse<{ room: Room }>>(`${this.baseUrl}/${roomId}`)
      .pipe(map((res) => (res.data as any).room));
  }

  /** Alias kept for components that call getRoomById() */
  getRoomById(roomId: string): Observable<ApiResponse<{ room: Room }>> {
    return this.http.get<ApiResponse<{ room: Room }>>(
      `${this.baseUrl}/${roomId}`,
    );
  }

  /** Updates room settings (accepts FormData for optional image upload) */
  updateRoom(roomId: string, data: FormData): Observable<ApiResponse<{ room: Room }>> {
    return this.http.patch<ApiResponse<{ room: Room }>>(
      `${this.baseUrl}/${roomId}`,
      data,
    );
  }
  createRoom(data: FormData): Observable<ApiResponse<{ room: Room }>> {
    return this.http.post<ApiResponse<{ room: Room }>>(this.baseUrl, data);
  }

  joinRoom(roomId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${roomId}/join`, {});
  }

  leaveRoom(roomId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${roomId}/members/me`);
  }

  getMembers(roomId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${roomId}/members`);
  }

  getRoomMembers(roomId: string): Observable<RoomMember[]> {
    return this.http
      .get<{
        status: string;
        data: { owner: RoomMember; members: { _id: string; user: RoomMember; joinedAt: string }[] };
      }>(`${this.baseUrl}/${roomId}/members`)
      .pipe(map((res) => [res.data.owner, ...res.data.members.map((m) => m.user)]));
  }

  getPending(roomId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${roomId}/pending`);
  }

  getPendingMembers(roomId: string): Observable<RoomMember[]> {
    return this.http
      .get<{ status: string; data: { pendingMembers: { user: RoomMember }[] } }>(
        `${this.baseUrl}/${roomId}/pending`,
      )
      .pipe(map((res) => res.data.pendingMembers.map((m) => m.user)));
  }

  approveMember(roomId: string, userId: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${roomId}/members/${userId}/approve`, {});
  }

  /** Reject a pending join request */
  rejectMember(roomId: string, userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${roomId}/pending/${userId}`);
  }

  removeMember(roomId: string, userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${roomId}/members/${userId}`);
  }
  kickMember(roomId: string, userId: string): Observable<any> {
    return this.removeMember(roomId, userId);
  }

  /** Checks whether the current user is a member of the given room */
  isMember(roomId: string): Observable<boolean> {
    return this.getRoomMembers(roomId).pipe(map(() => true));
  }
}
