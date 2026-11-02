import { createHash } from 'node:crypto';
import { getPool } from './db.js';
export async function enforceRateLimit({ subject, action, limit=60 }) {
  const key=createHash('sha256').update(`${subject}:${action}`).digest('hex');
  const { rows }=await getPool().query(`INSERT INTO api_rate_limits (rate_key,action,window_start,request_count) VALUES ($1,$2,date_trunc('minute',now()),1)
    ON CONFLICT (rate_key,action,window_start) DO UPDATE SET request_count=api_rate_limits.request_count+1 RETURNING request_count`,[key,action]);
  if(Number(rows[0]?.request_count || 0)>limit) throw Object.assign(new Error('Too many requests. Try again in about 60 seconds.'),{statusCode:429,code:'RATE_LIMITED'});
}
