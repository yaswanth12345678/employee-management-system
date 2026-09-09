import { pool } from '../../db/pool';

export interface PeerRow {
  user_id: string;
  employee_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  job_title: string | null;
}

export interface ConversationRow {
  id: string;
  updated_at: Date;
  peer_user_id: string;
  peer_employee_id: string | null;
  peer_first_name: string;
  peer_last_name: string;
  peer_email: string;
  peer_avatar_url: string | null;
  peer_job_title: string | null;
  last_message_id: string | null;
  last_message_body: string | null;
  last_message_sender_id: string | null;
  last_message_created_at: Date | null;
  last_message_read_at: Date | null;
  unread_count: number;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: Date;
  read_at: Date | null;
}

function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function listPeers(userId: string): Promise<PeerRow[]> {
  const { rows } = await pool.query<PeerRow>(
    `SELECT u.id AS user_id,
            e.id AS employee_id,
            COALESCE(e.first_name, split_part(u.email::text, '@', 1)) AS first_name,
            COALESCE(e.last_name, '') AS last_name,
            u.email::text AS email,
            e.avatar_url,
            e.job_title
     FROM users u
     LEFT JOIN employees e ON e.user_id = u.id
     WHERE u.id <> $1 AND u.is_active = TRUE
     ORDER BY COALESCE(e.first_name, u.email::text), COALESCE(e.last_name, '')`,
    [userId],
  );
  return rows;
}

export async function findPeer(userId: string, peerUserId: string): Promise<PeerRow | null> {
  const { rows } = await pool.query<PeerRow>(
    `SELECT u.id AS user_id,
            e.id AS employee_id,
            COALESCE(e.first_name, split_part(u.email::text, '@', 1)) AS first_name,
            COALESCE(e.last_name, '') AS last_name,
            u.email::text AS email,
            e.avatar_url,
            e.job_title
     FROM users u
     LEFT JOIN employees e ON e.user_id = u.id
     WHERE u.id = $1 AND u.is_active = TRUE AND u.id <> $2`,
    [peerUserId, userId],
  );
  return rows[0] ?? null;
}

export async function getOrCreateConversation(userId: string, peerUserId: string): Promise<string> {
  const [low, high] = pair(userId, peerUserId);
  const existing = await pool.query<{ id: string }>(
    `SELECT id FROM chat_conversations WHERE user_low = $1 AND user_high = $2`,
    [low, high],
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO chat_conversations (user_low, user_high)
     VALUES ($1, $2)
     ON CONFLICT (user_low, user_high) DO UPDATE SET user_low = EXCLUDED.user_low
     RETURNING id`,
    [low, high],
  );
  return inserted.rows[0].id;
}

export async function assertParticipant(conversationId: string, userId: string): Promise<boolean> {
  const { rows } = await pool.query<{ ok: boolean }>(
    `SELECT TRUE AS ok FROM chat_conversations
     WHERE id = $1 AND (user_low = $2 OR user_high = $2)`,
    [conversationId, userId],
  );
  return rows.length > 0;
}

export async function listConversations(userId: string): Promise<ConversationRow[]> {
  const { rows } = await pool.query<ConversationRow>(
    `SELECT c.id,
            c.updated_at,
            peer.id AS peer_user_id,
            e.id AS peer_employee_id,
            COALESCE(e.first_name, split_part(peer.email::text, '@', 1)) AS peer_first_name,
            COALESCE(e.last_name, '') AS peer_last_name,
            peer.email::text AS peer_email,
            e.avatar_url AS peer_avatar_url,
            e.job_title AS peer_job_title,
            lm.id AS last_message_id,
            lm.body AS last_message_body,
            lm.sender_id AS last_message_sender_id,
            lm.created_at AS last_message_created_at,
            lm.read_at AS last_message_read_at,
            (
              SELECT COUNT(*)::int FROM chat_messages m
              WHERE m.conversation_id = c.id
                AND m.sender_id <> $1
                AND m.read_at IS NULL
            ) AS unread_count
     FROM chat_conversations c
     JOIN users peer ON peer.id = CASE WHEN c.user_low = $1 THEN c.user_high ELSE c.user_low END
     LEFT JOIN employees e ON e.user_id = peer.id
     LEFT JOIN LATERAL (
       SELECT m.id, m.body, m.sender_id, m.created_at, m.read_at
       FROM chat_messages m
       WHERE m.conversation_id = c.id
       ORDER BY m.created_at DESC
       LIMIT 1
     ) lm ON TRUE
     WHERE c.user_low = $1 OR c.user_high = $1
     ORDER BY c.updated_at DESC`,
    [userId],
  );
  return rows;
}

export async function listMessages(
  conversationId: string,
  limit: number,
  offset: number,
): Promise<{ rows: MessageRow[]; total: number }> {
  const [list, count] = await Promise.all([
    pool.query<MessageRow>(
      `SELECT id, conversation_id, sender_id, body, created_at, read_at
       FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset],
    ),
    pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM chat_messages WHERE conversation_id = $1`,
      [conversationId],
    ),
  ]);
  return { rows: list.rows, total: count.rows[0]?.total ?? 0 };
}

export async function insertMessage(
  conversationId: string,
  senderId: string,
  body: string,
): Promise<MessageRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<MessageRow>(
      `INSERT INTO chat_messages (conversation_id, sender_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, conversation_id, sender_id, body, created_at, read_at`,
      [conversationId, senderId, body],
    );
    await client.query(`UPDATE chat_conversations SET updated_at = now() WHERE id = $1`, [
      conversationId,
    ]);
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  await pool.query(
    `UPDATE chat_messages
     SET read_at = now()
     WHERE conversation_id = $1
       AND sender_id <> $2
       AND read_at IS NULL`,
    [conversationId, userId],
  );
}

export async function unreadCount(userId: string): Promise<number> {
  const { rows } = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count
     FROM chat_messages m
     JOIN chat_conversations c ON c.id = m.conversation_id
     WHERE (c.user_low = $1 OR c.user_high = $1)
       AND m.sender_id <> $1
       AND m.read_at IS NULL`,
    [userId],
  );
  return rows[0]?.count ?? 0;
}

export async function peerUserId(conversationId: string, userId: string): Promise<string | null> {
  const { rows } = await pool.query<{ peer_id: string }>(
    `SELECT CASE WHEN user_low = $2 THEN user_high ELSE user_low END AS peer_id
     FROM chat_conversations
     WHERE id = $1 AND (user_low = $2 OR user_high = $2)`,
    [conversationId, userId],
  );
  return rows[0]?.peer_id ?? null;
}
