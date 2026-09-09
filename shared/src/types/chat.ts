/** Direct-message chat between authenticated users. */

export interface ChatPeerDTO {
  userId: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  jobTitle?: string;
}

export interface ChatMessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

export interface ChatConversationDTO {
  id: string;
  peer: ChatPeerDTO;
  lastMessage?: ChatMessageDTO;
  unreadCount: number;
  updatedAt: string;
}

export interface StartConversationRequest {
  peerUserId: string;
}

export interface SendChatMessageRequest {
  body: string;
}

export interface ChatUnreadCountDTO {
  count: number;
}
