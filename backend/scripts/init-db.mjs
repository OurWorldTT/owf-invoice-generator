import { readFile } from 'node:fs/promises'; import { Pool,neonConfig } from '@neondatabase/serverless'; import ws from 'ws';
if(typeof globalThis.WebSocket==='undefined')neonConfig.webSocketConstructor=ws;const url=process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL;if(!url)throw new Error('Set DATABASE_URL_UNPOOLED before running db:init.');
const pool=new Pool({connectionString:url});try{await pool.query(await readFile(new URL('../sql/001-public-api-foundation.sql',import.meta.url),'utf8'));}finally{await pool.end();}console.log('Public API schema migration applied.');
