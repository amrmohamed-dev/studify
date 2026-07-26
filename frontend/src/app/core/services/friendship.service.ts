import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../models/api.model';

export interface FriendEntry {
  _id: string;
  status: 'accepted';
  createdAt: string;
  updatedAt: string;
  friend: User;
}

export interface PendingRequest {
  _id: string;
  status: 'pending';
  createdAt: string;
  updatedAt: string;
  requester: User;
  recipient: User;
}

@Injectable({
  providedIn: 'root',
})
export class FriendshipService {
  private baseUrl = environment.apiUrl + '/friends';
  private usersUrl = environment.apiUrl + '/users';

  constructor(private http: HttpClient) {}

  getFriends(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<ApiResponse<{ friends: FriendEntry[] }>> {
    return this.http.get<ApiResponse<{ friends: FriendEntry[] }>>(
      this.baseUrl,
      { params: params as any },
    );
  }

  getPendingRequests(): Observable<
    ApiResponse<{ requests: PendingRequest[] }>
  > {
    return this.http.get<ApiResponse<{ requests: PendingRequest[] }>>(
      `${this.baseUrl}/requests`,
    );
  }

  sendFriendRequest(recipientId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/request`, {
      recipientId,
    });
  }

  acceptFriendRequest(friendshipId: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/${friendshipId}/accept`,
      {},
    );
  }

  rejectFriendRequest(friendshipId: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/${friendshipId}/reject`,
      {},
    );
  }

  searchUsers(search: string): Observable<ApiResponse<{ users: User[] }>> {
    return this.http.get<ApiResponse<{ users: User[] }>>(this.usersUrl, {
      params: { search, limit: 10 } as any,
    });
  }
}
