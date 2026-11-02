import { randomUUID } from 'node:crypto'; import { applyCors } from '../../lib/cors.js'; import { requireAuth } from '../../lib/auth.js';
import { ensureUser } from '../../lib/users.js'; import { getPool } from '../../lib/db.js'; import { enforceRateLimit } from '../../lib/rate-limit.js';
import { readJson,sendError } from '../../lib/http.js'; import { serializeDocument,validateDocument } from '../../lib/documents.js';
export default async function handler(req,res){
  if(applyCors(req,res))return; if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
  try{const identity=await requireAuth(req); await enforceRateLimit({subject:identity.subject,action:`documents:${req.method}`,limit:req.method==='POST'?20:90}); const user=await ensureUser(identity);
    if(req.method==='GET'){const search=String(req.query.search||'').trim().slice(0,200),type=String(req.query.type||'').trim(); const limit=Math.min(Math.max(Number(req.query.limit)||100,1),200);
      const{rows}=await getPool().query(`SELECT * FROM documents WHERE user_id=$1 AND ($2='' OR document_type=$2) AND ($3='' OR document_number ILIKE '%'||$3||'%' OR client_name ILIKE '%'||$3||'%') ORDER BY created_at DESC LIMIT $4`,[user.id,type,search,limit]);
      return res.status(200).json({documents:rows.map(serializeDocument)});}
    const body=readJson(req); const document=validateDocument(body.document||body); const client=await getPool().connect();
    try{await client.query('BEGIN'); const freshUser=await ensureUser(identity,client); const issueYear=Number(document.issueDate.slice(0,4));
      const counter=await client.query(`INSERT INTO document_counters(user_id,document_type,issue_year,last_sequence) VALUES($1,$2,$3,1) ON CONFLICT(user_id,document_type,issue_year) DO UPDATE SET last_sequence=document_counters.last_sequence+1,updated_at=now() RETURNING last_sequence`,[freshUser.id,document.documentType,issueYear]);
      const sequence=Number(counter.rows[0].last_sequence),prefix=document.documentType==='receipt'?'RCT':'INV',documentNumber=`${prefix}-${issueYear}-${String(sequence).padStart(4,'0')}`,requestId=document.requestId||randomUUID();
      const{rows}=await client.query(`INSERT INTO documents(user_id,request_id,document_type,document_number,sequence,issue_year,status,issue_date,due_date,client_name,client_email,client_phone,client_address,currency,items,subtotal,tax_total,discount_total,delivery_fee,total,payment_method,transaction_reference,notes)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING *`,[freshUser.id,requestId,document.documentType,documentNumber,sequence,issueYear,document.status,document.issueDate,document.dueDate,document.clientName,document.clientEmail,document.clientPhone,document.clientAddress,document.currency,JSON.stringify(document.items),document.subtotal,document.taxTotal,document.discountTotal,document.deliveryFee,document.total,document.paymentMethod,document.transactionReference,document.notes]);
      await client.query('COMMIT'); return res.status(201).json({document:serializeDocument(rows[0])});
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }catch(error){sendError(res,error);}
}
