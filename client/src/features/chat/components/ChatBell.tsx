import { Badge, IconButton, Tooltip } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useChat } from './ChatProvider';

/** Topbar chat icon with unread badge; opens the chat drawer. */
export function ChatBell() {
  const { unreadCount, openChat } = useChat();

  return (
    <Tooltip title="Chat">
      <IconButton color="inherit" onClick={() => openChat()} aria-label="open chat">
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <ChatIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
