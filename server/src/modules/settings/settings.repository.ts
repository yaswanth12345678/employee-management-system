import { pool } from '../../db/pool';

export interface SettingsRow {
  theme: string;
  locale: string;
  email_notifications: boolean;
  in_app_notifications: boolean;
}

/** Fetch settings, creating the default row on first access. */
export async function getOrCreate(userId: string): Promise<SettingsRow> {
  await pool.query('INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
  const { rows } = await pool.query<SettingsRow>(
    'SELECT theme, locale, email_notifications, in_app_notifications FROM user_settings WHERE user_id = $1',
    [userId],
  );
  return rows[0];
}

export interface UpdateSettingsFields {
  theme?: string;
  locale?: string;
  emailNotifications?: boolean;
  inAppNotifications?: boolean;
}

const COLUMNS: Record<keyof UpdateSettingsFields, string> = {
  theme: 'theme',
  locale: 'locale',
  emailNotifications: 'email_notifications',
  inAppNotifications: 'in_app_notifications',
};

export async function update(userId: string, fields: UpdateSettingsFields): Promise<SettingsRow> {
  await pool.query('INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, column] of Object.entries(COLUMNS)) {
    const value = fields[key as keyof UpdateSettingsFields];
    if (value !== undefined) {
      sets.push(`${column} = $${i++}`);
      values.push(value);
    }
  }
  if (sets.length > 0) {
    values.push(userId);
    await pool.query(`UPDATE user_settings SET ${sets.join(', ')} WHERE user_id = $${i}`, values);
  }
  return getOrCreate(userId);
}
