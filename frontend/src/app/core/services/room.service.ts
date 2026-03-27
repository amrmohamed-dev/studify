import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment';
import { Room, ApiResponse } from '../models/room.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
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
    return this.http.get<ApiResponse<Room[]>>(this.baseUrl, { params: params as any });
  }


  joinRoom(roomId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${roomId}/join`, {});
  }

  getMembers(roomId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${roomId}/members`);
  }

  getPending(roomId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${roomId}/pending`);
  }

  approveMember(roomId: string, userId: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${roomId}/members/${userId}/approve`, {});
  }

  rejectMember(roomId: string, userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${roomId}/members/${userId}/reject`);
  }


  removeMember(roomId: string, userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${roomId}/members/${userId}`);
  }
}