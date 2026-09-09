import type {
  ChatConversationDTO,
  ChatMessageDTO,
  ChatPeerDTO,
  PaginatedResponse,
} from '@ems/shared';
import { ForbiddenError, NotFoundError, ValidationError } from '../../common/errors';
import { buildPaginationMeta } from '../../common/http/pagination';
import { emitToUser } from '../../realtime/realtime';
import * as repo from './chat.repository';
import type { ConversationRow, MessageRow, PeerRow } from './chat.repository';

function toPeer(row: PeerRow): ChatPeerDTO {
  return {
    userId: row.user_id,
    employeeId: row.employee_id ?? undefined,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    avatarUrl: row.avatar_url ?? undefined,
    jobTitle: row.job_title ?? undefined,
  };
}

function toMessage(row: MessageRow): ChatMessageDTO {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at.toISOString(),
    readAt: row.read_at ? row.read_at.toISOString() : undefined,
  };
}

function toConversation(row: ConversationRow): ChatConversationDTO {
  return {
    id: row.id,
    peer: {
      userId: row.peer_user_id,
      employeeId: row.peer_employee_id ?? undefined,
      firstName: row.peer_first_name,
      lastName: row.peer_last_name,
      email: row.peer_email,
      avatarUrl: row.peer_avatar_url ?? undefined,
      jobTitle: row.peer_job_title ?? undefined,
    },
    lastMessage: row.last_message_id
      ? {
          id: row.last_message_id,
          conversationId: row.id,
          senderId: row.last_message_sender_id!,
          body: row.last_message_body!,
          createdAt: row.last_message_created_at!.toISOString(),
          readAt: row.last_message_read_at
            ? row.last_message_read_at.toISOString()
            : undefined,
        }
      : undefined,
    unreadCount: row.unread_count,
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listPeers(userId: string): Promise<ChatPeerDTO[]> {
  return (await repo.listPeers(userId)).map(toPeer);
}

export async function listConversations(userId: string): Promise<ChatConversationDTO[]> {
  return (await repo.listConversations(userId)).map(toConversation);
}

export async function startConversation(
  userId: string,
  peerUserId: string,
): Promise<ChatConversationDTO> {
  if (peerUserId === userId) throw new ValidationError('Cannot start a chat with yourself');
  const peer = await repo.findPeer(userId, peerUserId);
  if (!peer) throw new NotFoundError('User not found');

  const conversationId = await repo.getOrCreateConversation(userId, peerUserId);
  const conversations = await repo.listConversations(userId);
  const found = conversations.find((c) => c.id === conversationId);
  if (found) return toConversation(found);

  return {
    id: conversationId,
    peer: toPeer(peer),
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function listMessages(
  userId: string,
  conversationId: string,
  page: number,
  limit: number,
): Promise<PaginatedResponse<ChatMessageDTO>> {
  if (!(await repo.assertParticipant(conversationId, userId))) {
    throw new ForbiddenError('Not a participant in this conversation');
  }
  const { rows, total } = await repo.listMessages(conversationId, limit, (page - 1) * limit);
  // Return chronological order for the UI (repo is DESC for pagination).
  const chronological = [...rows].reverse().map(toMessage);
  return {
    data: chronological,
    meta: { pagination: buildPaginationMeta(page, limit, total) },
  };
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  body: string,
): Promise<ChatMessageDTO> {
  if (!(await repo.assertParticipant(conversationId, userId))) {
    throw new ForbiddenError('Not a participant in this conversation');
  }
  const row = await repo.insertMessage(conversationId, userId, body);
  const message = toMessage(row);

  const peerId = await repo.peerUserId(conversationId, userId);
  if (peerId) {
    emitToUser(peerId, { type: 'chat_message', message, conversationId });
  }
  // Echo to other devices of the sender as well.
  emitToUser(userId, { type: 'chat_message', message, conversationId });

  return message;
}

export async function markRead(userId: string, conversationId: string): Promise<void> {
  if (!(await repo.assertParticipant(conversationId, userId))) {
    throw new ForbiddenError('Not a participant in this conversation');
  }
  await repo.markConversationRead(conversationId, userId);
}

export function unreadCount(userId: string): Promise<number> {
  return repo.unreadCount(userId);
}
