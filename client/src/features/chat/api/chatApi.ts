import type {
  ApiResponse,
  ChatConversationDTO,
  ChatMessageDTO,
  ChatPeerDTO,
  ChatUnreadCountDTO,
  PaginatedResponse,
  SendChatMessageRequest,
  StartConversationRequest,
} from '@ems/shared';
import { httpClient } from '../../../lib/http';

export async function listPeers(): Promise<ChatPeerDTO[]> {
  const { data } = await httpClient.get<ApiResponse<ChatPeerDTO[]>>('/chat/peers');
  return data.data;
}

export async function listConversations(): Promise<ChatConversationDTO[]> {
  const { data } = await httpClient.get<ApiResponse<ChatConversationDTO[]>>('/chat/conversations');
  return data.data;
}

export async function startConversation(
  payload: StartConversationRequest,
): Promise<ChatConversationDTO> {
  const { data } = await httpClient.post<ApiResponse<ChatConversationDTO>>(
    '/chat/conversations',
    payload,
  );
  return data.data;
}

export async function listMessages(
  conversationId: string,
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<ChatMessageDTO>> {
  const { data } = await httpClient.get<PaginatedResponse<ChatMessageDTO>>(
    `/chat/conversations/${conversationId}/messages`,
    { params: { page, limit } },
  );
  return data;
}

export async function sendMessage(
  conversationId: string,
  payload: SendChatMessageRequest,
): Promise<ChatMessageDTO> {
  const { data } = await httpClient.post<ApiResponse<ChatMessageDTO>>(
    `/chat/conversations/${conversationId}/messages`,
    payload,
  );
  return data.data;
}

export async function markRead(conversationId: string): Promise<void> {
  await httpClient.patch(`/chat/conversations/${conversationId}/read`);
}

export async function unreadCount(): Promise<number> {
  const { data } = await httpClient.get<ApiResponse<ChatUnreadCountDTO>>('/chat/unread-count');
  return data.data.count;
}
