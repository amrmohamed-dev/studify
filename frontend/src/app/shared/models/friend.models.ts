import { ApiMeta, UserPreview } from './room.models';

export interface FriendRecord {
  _id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  friend: UserPreview;
}

export interface PendingFriendRequest {
  _id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  requester: UserPreview;
  recipient: UserPreview;
}

export interface FriendListResult {
  items: FriendRecord[];
  meta: ApiMeta;
}
