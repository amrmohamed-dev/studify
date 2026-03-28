export interface ApiMeta {
  total: number;
  results: number;
  totalPages: number;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: ApiMeta;
}

export interface ImageAsset {
  url: string | null;
  publicId?: string | null;
}

export interface UserPreview {
  _id: string;
  name: string;
  email?: string;
  image?: ImageAsset | null;
}

export type User = UserPreview;

export interface RoomMemberRecord {
  user: UserPreview;
  joinedAt?: string;
  requestedAt?: string;
}

export type RoomPrivacy = 'public' | 'private_request' | 'private_password';

export interface Room {
  _id: string;
  name: string;
  description?: string;
  image?: ImageAsset | null;
  createdBy: UserPreview;
  privacyType: RoomPrivacy;
  maxMembers: number;
  members: RoomMemberRecord[];
  pendingMembers: RoomMemberRecord[];
  createdAt?: string;
  updatedAt?: string;
  membersCount?: number;
}

export interface RoomJoinResult {
  message: string;
  room: Room | null;
}

export interface RoomMemberEvent {
  roomId: string;
  user: UserPreview;
}

export interface RoomJoinRequestEvent {
  roomId: string;
  user: UserPreview;
}

export interface RoomKickedEvent {
  roomId: string;
}

export interface RoomUpdatedEvent {
  room: Room;
}

export interface ChatMessage {
  _id?: string;
  _tempId?: string;
  room?: string | { _id: string; name?: string };
  sender: {
    _id: string;
    name?: string;
  };
  content: string;
  createdAt: string;
}

export interface TaskDoneRecord {
  user: UserPreview | string;
}

export interface RoomTask {
  _id: string;
  title: string;
  room: string;
  createdBy?: UserPreview | string;
  doneBy?: TaskDoneRecord[];
  doneCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type SessionType = 'study' | 'break';
export type SessionStatus = 'active' | 'ended';

export interface StudySession {
  sessionId: string;
  roomId: string;
  startedBy: string;
  type: SessionType;
  status: SessionStatus;
  duration: number;
  startedAt: string;
  endsAt: string;
  cycle: number;
}
