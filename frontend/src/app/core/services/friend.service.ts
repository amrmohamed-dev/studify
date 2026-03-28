import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  FriendListResult,
  FriendRecord,
  PendingFriendRequest,
} from '../../shared/models/friend.models';
import { ApiMeta, PaginatedResult, UserPreview } from '../../shared/models/room.models';

interface UsersResponse {
  status: string;
  meta: ApiMeta;
  data: {
    users: UserPreview[];
  };
}

interface FriendsResponse {
  status: string;
  meta: ApiMeta;
  data: {
    friends: FriendRecord[];
  };
}

interface PendingRequestsResponse {
  status: string;
  data: {
    requests: PendingFriendRequest[];
  };
}

@Injectable({ providedIn: 'root' })
export class FriendService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api/v1/friends';

  getAllUsers(limit = 50, page = 1): Observable<PaginatedResult<UserPreview>> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());

    return this.http.get<UsersResponse>('/api/v1/users', { params }).pipe(
      map((response) => ({
        items: response.data.users,
        meta: response.meta,
      })),
    );
  }

  getFriends(limit = 50, page = 1): Observable<FriendListResult> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());

    return this.http.get<FriendsResponse>(this.api, { params }).pipe(
      map((response) => ({
        items: response.data.friends,
        meta: response.meta,
      })),
    );
  }

  getRequests(): Observable<PendingFriendRequest[]> {
    return this.http.get<PendingRequestsResponse>(`${this.api}/requests`).pipe(
      map((response) => response.data.requests),
    );
  }

  sendRequest(id: string): Observable<unknown> {
    return this.http.post(`${this.api}/request`, {
      recipientId: id,
    });
  }

  accept(id: string): Observable<unknown> {
    return this.http.patch(`${this.api}/${id}/accept`, {});
  }

  reject(id: string): Observable<unknown> {
    return this.http.patch(`${this.api}/${id}/reject`, {});
  }
}
