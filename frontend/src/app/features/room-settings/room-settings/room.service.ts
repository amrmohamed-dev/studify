import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  private baseUrl = '/api/v1/rooms';

  constructor(private http: HttpClient) {}

  getRoomById(roomId: string) {
    return this.http.get(`${this.baseUrl}/${roomId}`);
  }

  updateRoom(roomId: string, data: FormData) {
    return this.http.patch(`${this.baseUrl}/${roomId}`, data);
  }
}
