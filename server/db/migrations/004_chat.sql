-- =========================================================================
-- 004_chat · Direct-message conversations between users
-- =========================================================================

CREATE TABLE chat_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_low   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_chat_pair CHECK (user_low < user_high),
  CONSTRAINT uq_chat_pair UNIQUE (user_low, user_high)
);
CREATE INDEX idx_chat_conversations_updated ON chat_conversations(updated_at DESC);

CREATE TABLE chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 4000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at         TIMESTAMPTZ
);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_chat_messages_unread ON chat_messages(conversation_id, sender_id)
  WHERE read_at IS NULL;

CREATE TRIGGER trg_chat_conversations_updated
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
