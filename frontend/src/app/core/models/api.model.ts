export interface ApiResponse<TData = unknown> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  data?: TData;
}

export interface ImageAsset {
  url: string | null;
  publicId: string | null;
}

export interface Room {
  _id: string;
  name: string;
  image: ImageAsset;
  createdAt?: string;
}

export interface FavouriteRoom {
  room: Room | string;
  addedAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  isVerified?: boolean;
  image?: ImageAsset;
  favouriteRooms?: FavouriteRoom[];
  createdAt?: string;
}
