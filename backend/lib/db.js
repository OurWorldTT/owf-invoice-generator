import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
if (typeof globalThis.WebSocket === 'undefined') neonConfig.webSocketConstructor = ws;
let pool;
export function getPool() {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error('DATABASE_URL is not configured.'), { statusCode: 503 });
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}
