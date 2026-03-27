
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

export interface Room {
  _id: string;
  name: string;
  description?: string;
  image?: string;

  owner?: User;
  membersCount?: number;
  status?: RoomStatus;
  tags?: string[];
  createdAt?: string;

  isFavourite?: boolean;
  isJoined?: boolean;
}