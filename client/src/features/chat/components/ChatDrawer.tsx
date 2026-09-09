import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import type { ChatMessageDTO, ChatPeerDTO } from '@ems/shared';
import { useAuth } from '../../../contexts/AuthContext';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import type { NormalizedError } from '../../../lib/http';
import * as chatApi from '../api/chatApi';
import { useChat } from './ChatProvider';

type View = 'list' | 'new' | 'thread';

function peerLabel(firstName: string, lastName: string, email: string): string {
  const name = `${firstName} ${lastName}`.trim();
  return name || email;
}

export function ChatDrawer() {
  const { user } = useAuth();
  const { notify } = useSnackbar();
  const {
    open,
    closeChat,
    conversations,
    refreshConversations,
    activeConversationId,
    setActiveConversationId,
    liveMessage,
    clearLiveMessage,
    refreshUnread,
  } = useChat();

  const [view, setView] = useState<View>('list');
  const [peers, setPeers] = useState<ChatPeerDTO[]>([]);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingPeers, setLoadingPeers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openThread = useCallback(
    async (conversationId: string) => {
      setActiveConversationId(conversationId);
      setView('thread');
      setLoadingThread(true);
      try {
        const res = await chatApi.listMessages(conversationId);
        setMessages(res.data);
        await chatApi.markRead(conversationId);
        refreshUnread();
        await refreshConversations();
      } catch (err) {
        notify((err as NormalizedError).message, 'error');
      } finally {
        setLoadingThread(false);
      }
    },
    [notify, refreshConversations, refreshUnread, setActiveConversationId],
  );

  useEffect(() => {
    if (!open) {
      setView('list');
      setDraft('');
      setMessages([]);
      return;
    }
    void refreshConversations();
    if (activeConversationId) void openThread(activeConversationId);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- open transition only

  useEffect(() => {
    if (!liveMessage) return;
    if (liveMessage.conversationId === activeConversationId && view === 'thread') {
      setMessages((prev) =>
        prev.some((m) => m.id === liveMessage.id) ? prev : [...prev, liveMessage],
      );
      if (liveMessage.senderId !== user?.id) {
        void chatApi.markRead(liveMessage.conversationId).then(refreshUnread);
      }
    }
    clearLiveMessage();
  }, [liveMessage, activeConversationId, view, user?.id, clearLiveMessage, refreshUnread]);

  useEffect(() => {
    if (view === 'thread') scrollToBottom();
  }, [messages, view]);

  const handleNewChat = async () => {
    setView('new');
    setLoadingPeers(true);
    try {
      setPeers(await chatApi.listPeers());
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setLoadingPeers(false);
    }
  };

  const handleStartWithPeer = async (peerUserId: string) => {
    try {
      const conversation = await chatApi.startConversation({ peerUserId });
      await refreshConversations();
      await openThread(conversation.id);
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    }
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !activeConversationId || sending) return;
    setSending(true);
    try {
      const message = await chatApi.sendMessage(activeConversationId, { body });
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );
      setDraft('');
      await refreshConversations();
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={closeChat}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
        >
          {view !== 'list' && (
            <IconButton
              size="small"
              aria-label="back"
              onClick={() => {
                setView('list');
                setActiveConversationId(null);
                setMessages([]);
                void refreshConversations();
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }} noWrap>
            {view === 'list' && 'Chat'}
            {view === 'new' && 'New chat'}
            {view === 'thread' &&
              activeConversation &&
              peerLabel(
                activeConversation.peer.firstName,
                activeConversation.peer.lastName,
                activeConversation.peer.email,
              )}
          </Typography>
          <IconButton size="small" onClick={closeChat} aria-label="close chat">
            <CloseIcon />
          </IconButton>
        </Stack>

        {view === 'list' && (
          <>
            <Box sx={{ p: 2 }}>
              <Button fullWidth variant="contained" onClick={() => void handleNewChat()}>
                New chat
              </Button>
            </Box>
            <Divider />
            <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
              {conversations.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                  No conversations yet. Start a new chat with a teammate.
                </Typography>
              )}
              {conversations.map((c) => (
                <ListItemButton key={c.id} onClick={() => void openThread(c.id)}>
                  <ListItemAvatar>
                    <Avatar src={c.peer.avatarUrl}>
                      {c.peer.firstName.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={peerLabel(c.peer.firstName, c.peer.lastName, c.peer.email)}
                    secondary={c.lastMessage?.body ?? 'No messages yet'}
                    primaryTypographyProps={{ fontWeight: c.unreadCount > 0 ? 700 : 500 }}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                  {c.unreadCount > 0 && (
                    <Typography variant="caption" color="error" fontWeight={700}>
                      {c.unreadCount}
                    </Typography>
                  )}
                </ListItemButton>
              ))}
            </List>
          </>
        )}

        {view === 'new' && (
          <List sx={{ flex: 1, overflow: 'auto' }}>
            {loadingPeers && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {!loadingPeers &&
              peers.map((peer) => (
                <ListItemButton
                  key={peer.userId}
                  onClick={() => void handleStartWithPeer(peer.userId)}
                >
                  <ListItemAvatar>
                    <Avatar src={peer.avatarUrl}>{peer.firstName.charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={peerLabel(peer.firstName, peer.lastName, peer.email)}
                    secondary={peer.jobTitle || peer.email}
                  />
                </ListItemButton>
              ))}
          </List>
        )}

        {view === 'thread' && (
          <>
            <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1.5 }}>
              {loadingThread && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              )}
              {!loadingThread && messages.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
                  Say hello — send the first message.
                </Typography>
              )}
              {messages.map((m) => {
                const mine = m.senderId === user?.id;
                return (
                  <Box
                    key={m.id}
                    sx={{
                      display: 'flex',
                      justifyContent: mine ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '80%',
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: mine ? 'primary.main' : 'action.hover',
                        color: mine ? 'primary.contrastText' : 'text.primary',
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {m.body}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.75, display: 'block', mt: 0.5 }}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              <div ref={bottomRef} />
            </Box>
            <Divider />
            <Stack direction="row" spacing={1} sx={{ p: 1.5 }} alignItems="flex-end">
              <TextField
                fullWidth
                size="small"
                multiline
                maxRows={4}
                placeholder="Type a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <IconButton
                color="primary"
                onClick={() => void handleSend()}
                disabled={sending || !draft.trim()}
                aria-label="send message"
              >
                {sending ? <CircularProgress size={20} /> : <SendIcon />}
              </IconButton>
            </Stack>
          </>
        )}
      </Box>
    </Drawer>
  );
}
