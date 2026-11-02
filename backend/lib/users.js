import { getPool } from './db.js';
export async function ensureUser(identity, client = getPool()) {
  const { rows } = await client.query(`INSERT INTO user_profiles (auth_subject,email,display_name) VALUES ($1,$2,$3)
    ON CONFLICT (auth_subject) DO UPDATE SET email=CASE WHEN EXCLUDED.email<>'' THEN EXCLUDED.email ELSE user_profiles.email END,
    display_name=CASE WHEN EXCLUDED.display_name<>'' THEN EXCLUDED.display_name ELSE user_profiles.display_name END, updated_at=now() RETURNING *`,
    [identity.subject, identity.email, identity.displayName]);
  return rows[0];
}
