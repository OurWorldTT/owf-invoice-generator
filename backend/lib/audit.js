import { getPool } from './db.js';
export async function recordAudit(userId,action,metadata={},client=getPool()){await client.query('INSERT INTO audit_events(user_id,action,metadata) VALUES($1,$2,$3::jsonb)',[userId,action,JSON.stringify(metadata)]);}
