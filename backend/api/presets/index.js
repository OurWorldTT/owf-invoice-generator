import { applyCors } from '../../lib/cors.js';import { requireAuth } from '../../lib/auth.js';import { ensureUser } from '../../lib/users.js';import { getPool } from '../../lib/db.js';import { enforceRateLimit } from '../../lib/rate-limit.js';import { readJson,sendError } from '../../lib/http.js';
const clean=(value,max)=>String(value??'').trim().slice(0,max);const serialize=(row)=>({id:row.id,name:row.client_name,phone:row.client_phone,email:row.client_email});
export default async function handler(req,res){if(applyCors(req,res))return;if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
  try{const identity=await requireAuth(req);await enforceRateLimit({subject:identity.subject,action:`presets:${req.method}`,limit:60});const user=await ensureUser(identity);
    if(req.method==='GET'){const{rows}=await getPool().query('SELECT * FROM client_presets WHERE user_id=$1 ORDER BY lower(client_name)',[user.id]);return res.status(200).json({presets:rows.map(serialize)});}
    const body=readJson(req),name=clean(body.name,200);if(!name)throw Object.assign(new Error('Preset name is required.'),{statusCode:400});
    const{rows}=await getPool().query('INSERT INTO client_presets(user_id,client_name,client_phone,client_email) VALUES($1,$2,$3,$4) RETURNING *',[user.id,name,clean(body.phone,50),clean(body.email,320)]);res.status(201).json({preset:serialize(rows[0])});
  }catch(error){sendError(res,error);}}
