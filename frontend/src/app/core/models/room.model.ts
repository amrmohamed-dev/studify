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
export type PrivacyType = 'public' | 'private_request' | 'private_password';


export interface Room {
  _id: string;
  name: string;
  privacyType: PrivacyType;
  maxMembers: number;
  image?: {
    url: string | null;
    publicId?: string | null;
  };
  createdBy: User;
  members: { user: User; joinedAt: string }[];
  pendingMembers?: { user: User; requestedAt: string }[];
  createdAt?: string;


  isFavourite?: boolean;
  isJoined?: boolean;
}


export interface RoomView {
  _id: string;
  name: string;
  imageUrl: string | null;
  status: 'public' | 'private';
  membersCount: number;
  createdBy: User;
  isFavourite: boolean;
  isJoined: boolean;
}

export function toRoomView(room: Room, currentUserId?: string): RoomView {
  return {
    _id: room._id,
    name: room.name,
    imageUrl: room.image?.url ?? null,
    status: room.privacyType === 'public' ? 'public' : 'private',
    membersCount: room.members?.length ?? 0,
    createdBy: room.createdBy,
    isFavourite: room.isFavourite ?? false,
    isJoined:
      room.isJoined ??
      (!!currentUserId &&
        (room.createdBy?._id === currentUserId ||
          room.members?.some((m) => m.user?._id === currentUserId))),
  };
}
