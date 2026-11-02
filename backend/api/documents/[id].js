import { applyCors } from '../../lib/cors.js'; import { requireAuth } from '../../lib/auth.js'; import { ensureUser } from '../../lib/users.js';
import { getPool } from '../../lib/db.js'; import { enforceRateLimit } from '../../lib/rate-limit.js'; import { sendError } from '../../lib/http.js'; import { serializeDocument } from '../../lib/documents.js';
export default async function handler(req,res){if(applyCors(req,res))return;if(req.method!=='GET')return res.status(405).json({error:'Method not allowed.'});
  try{const identity=await requireAuth(req);await enforceRateLimit({subject:identity.subject,action:'documents:GET',limit:90});const user=await ensureUser(identity);const id=String(req.query.id||'');
    const{rows}=await getPool().query('SELECT * FROM documents WHERE user_id=$1 AND (id::text=$2 OR document_number=$2) LIMIT 1',[user.id,id]);if(!rows[0])return res.status(404).json({error:'Document not found.'});res.status(200).json({document:serializeDocument(rows[0])});
  }catch(error){sendError(res,error);}}
