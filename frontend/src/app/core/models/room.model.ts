export interface ApiResponse<T> {
  message: string;
  data: T;
  page?: number;
  totalPages?: number;
  totalResults?: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  image?: {
    url: string;
    publicId?: string;
  };
}

export type RoomStatus = 'public' | 'private';

export interface RoomMember {
  _id: string;
  user: User;
  joinedAt?: string;
}

export interface Room {
  _id: string;
  name: string;
  description?: string;
  image?: string;

  owner?: User;
  createdBy?: User;
  membersCount?: number;
  status?: RoomStatus;
  tags?: string[];
  createdAt?: string;

  maxMembers?: number;
  privacyType?: 'public' | 'private_request' | 'private_password';
  members?: RoomMember[];
  pendingMembers?: any[];

  isFavourite?: boolean;
  isJoined?: boolean;
}
