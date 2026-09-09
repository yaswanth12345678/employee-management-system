import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ChatConversationDTO, ChatMessageDTO } from '@ems/shared';
import { useAuth } from '../../../contexts/AuthContext';
import { onRealtime } from '../../../lib/realtime/socket';
import * as chatApi from '../api/chatApi';

interface ChatContextValue {
  open: boolean;
  openChat: (conversationId?: string) => void;
  closeChat: () => void;
  unreadCount: number;
  refreshUnread: () => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  conversations: ChatConversationDTO[];
  refreshConversations: () => Promise<void>;
  /** Live messages appended via websocket for the active thread. */
  liveMessage: ChatMessageDTO | null;
  clearLiveMessage: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversationDTO[]>([]);
  const [liveMessage, setLiveMessage] = useState<ChatMessageDTO | null>(null);

  const refreshUnread = useCallback(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    void chatApi.unreadCount().then(setUnreadCount).catch(() => undefined);
  }, [isAuthenticated]);

  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      return;
    }
    try {
      setConversations(await chatApi.listConversations());
    } catch {
      /* drawer refresh is best-effort */
    }
  }, [isAuthenticated]);

  const openChat = useCallback(
    (conversationId?: string) => {
      setOpen(true);
      if (conversationId) setActiveConversationId(conversationId);
      void refreshConversations();
      refreshUnread();
    },
    [refreshConversations, refreshUnread],
  );

  const closeChat = useCallback(() => {
    setOpen(false);
    setActiveConversationId(null);
  }, []);

  const clearLiveMessage = useCallback(() => setLiveMessage(null), []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setConversations([]);
      setOpen(false);
      return;
    }
    refreshUnread();
    const timer = setInterval(refreshUnread, 45000);
    const off = onRealtime((message) => {
      if (message.type !== 'chat_message') return;
      setLiveMessage(message.message);
      void refreshConversations();
      // Don't bump unread for my own echoes, or when viewing that thread.
      if (message.message.senderId === user?.id) return;
      if (open && activeConversationId === message.conversationId) return;
      setUnreadCount((c) => c + 1);
    });
    return () => {
      clearInterval(timer);
      off();
    };
  }, [
    isAuthenticated,
    refreshUnread,
    refreshConversations,
    user?.id,
    open,
    activeConversationId,
  ]);

  const value = useMemo(
    () => ({
      open,
      openChat,
      closeChat,
      unreadCount,
      refreshUnread,
      activeConversationId,
      setActiveConversationId,
      conversations,
      refreshConversations,
      liveMessage,
      clearLiveMessage,
    }),
    [
      open,
      openChat,
      closeChat,
      unreadCount,
      refreshUnread,
      activeConversationId,
      conversations,
      refreshConversations,
      liveMessage,
      clearLiveMessage,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
}
