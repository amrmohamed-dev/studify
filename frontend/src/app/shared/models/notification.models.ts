import { ApiMeta, UserPreview } from './room.models';

export interface NotificationItem {
  _id: string;
  type: string;
  message: string | null;
  isRead: boolean;
  link: string | null;
  createdAt: string;
  sender?: UserPreview | null;
  recipient?: UserPreview | null;
  metadata?: Record<string, unknown>;
}

export interface NotificationListResult {
  items: NotificationItem[];
  meta: ApiMeta;
}
