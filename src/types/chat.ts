export interface ChatUser {
  withUserId: string;
  lastMessage: string;
  sentAt: Date | null;
  isBlock: boolean;
  isOppositeBlock: boolean;
  userDetails: {
    name: string;
    profileImageUrl: string;
    isOnline: boolean;
    gender: string;
  };
}

export interface RecentChatsResult {
  data: ChatUser[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
}
