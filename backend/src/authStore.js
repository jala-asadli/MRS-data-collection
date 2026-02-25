import { getDb } from './db.js';

export async function initAuthStore() {
  const db = await getDb();
  await db.exec(`
    DROP TABLE IF EXISTS auth_credentials;
    DROP TABLE IF EXISTS auth_verifications;
    DROP TABLE IF EXISTS auth_password_resets;
  `);

  return true;
}
